import { Worker } from "bullmq";
import mongoose from "mongoose";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { Client } from "minio";
import dotenv from "dotenv";
import { Video } from "./models/videoModel.js";

dotenv.config({ path: "../.env" });

mongoose.connect(`${process.env.MONGODB_URI}/VideoTube`)
    .then(() => console.log("Worker connected to MongoDB"))
    .catch((err) => console.error("MongoDB Connection Failed", err));

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === "true" || false,
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const bucketName = "videos";
minioClient.bucketExists(bucketName, (err, exists) => {
    if (err) return console.log(err);
    if (!exists) {
        minioClient.makeBucket(bucketName, "us-east-1", (err) => {
            if (err) return console.log(err);
            console.log(`Bucket '${bucketName}' created successfully.`);
        });
    }
});

// ---------- helpers ----------
// Quality ladder. "short" = length of the shorter side, so portrait videos work too.
const LADDER = [
    { name: "360p", short: 360, bitrate: 800 },
    { name: "720p", short: 720, bitrate: 2500 },
    { name: "1080p", short: 1080, bitrate: 5000 },
];
const AUDIO_KBPS = 128;
const even = (n) => Math.max(2, Math.round(n / 2) * 2);

const probe = (file) =>
    new Promise((resolve, reject) => ffmpeg.ffprobe(file, (err, data) => (err ? reject(err) : resolve(data))));

// Never upscale: a 720p source gets 360p + 720p only. A fake "1080p" would look identical to 720p.
const pickVariants = (w, h) => {
    const landscape = w >= h;
    const short = Math.min(w, h);
    let picked = LADDER.filter((v) => v.short <= short);
    if (picked.length === 0) picked = [{ name: `${even(short)}p`, short: even(short), bitrate: 500 }];
    return picked.map((v) => ({
        ...v,
        outW: landscape ? even((w * v.short) / h) : v.short,
        outH: landscape ? v.short : even((h * v.short) / w),
        scale: landscape ? `scale=-2:${v.short}` : `scale=${v.short}:-2`, // keeps aspect ratio, no stretching
    }));
};

const transcodeVariant = (videoPath, outputDir, v) =>
    new Promise((resolve, reject) => {
        const dir = path.join(outputDir, v.name);
        ffmpeg(videoPath)
            .output(path.join(dir, "index.m3u8"))
            .videoCodec("libx264")
            .audioCodec("aac")
            .videoFilters(v.scale)
            .outputOptions([
                "-preset veryfast",
                "-pix_fmt yuv420p",
                `-b:v ${v.bitrate}k`,
                `-maxrate ${Math.round(v.bitrate * 1.07)}k`,
                `-bufsize ${Math.round(v.bitrate * 1.5)}k`,
                `-b:a ${AUDIO_KBPS}k`,
                // Keyframe every 2s in every rendition, so segments line up and quality switches are clean
                "-force_key_frames expr:gte(t,n_forced*2)",
                "-sc_threshold 0",
                "-hls_time 2",
                "-hls_playlist_type vod",
                "-hls_list_size 0",
                `-hls_segment_filename ${path.join(dir, "seg_%03d.ts")}`,
                "-f hls",
            ])
            .on("end", () => { console.log(`Finished ${v.name} (${v.outW}x${v.outH} @ ${v.bitrate}k)`); resolve(); })
            .on("error", (err) => { console.error(`Error processing ${v.name}:`, err); reject(err); })
            .run();
    });

const uploadDir = async (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const key = `${prefix}/${entry.name}`;
        if (entry.isDirectory()) await uploadDir(full, key);
        else {
            const type = entry.name.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
            await minioClient.fPutObject(bucketName, key, full, { "Content-Type": type });
        }
    }
};

// ---------- the job ----------
const worker = new Worker("video-transcoding", async (job) => {
    const { videoPath } = job.data;
    const videoId = String(job.data.videoId);
    console.log(`Processing video: ${videoId}`);

    const outputDir = `public/temp/${videoId}`;

    try {
        await Video.findByIdAndUpdate(videoId, { status: "processing" });

        // STEP 0: inspect the source (real duration + real resolution)
        const meta = await probe(videoPath);
        const vs = meta.streams.find((s) => s.codec_type === "video");
        if (!vs) throw new Error("No video stream found in the uploaded file");

        let w = vs.width, h = vs.height;
        const rotation = Math.abs(Number(vs.tags?.rotate ?? vs.side_data_list?.find((s) => s.rotation !== undefined)?.rotation ?? 0)) % 180;
        if (rotation === 90) [w, h] = [h, w]; // phone videos: ffmpeg auto-rotates, so swap dimensions
        const duration = Math.round(Number(meta.format.duration) || 0);

        const variants = pickVariants(w, h);
        console.log(`Source ${w}x${h}, ${duration}s -> renditions: ${variants.map((v) => v.name).join(", ")}`);

        variants.forEach((v) => fs.mkdirSync(path.join(outputDir, v.name), { recursive: true }));

        // STEP 1: transcode all renditions in parallel
        await Promise.all(variants.map((v) => transcodeVariant(videoPath, outputDir, v)));

        // STEP 2: master playlist built from what was actually produced
        const master = ["#EXTM3U", "#EXT-X-VERSION:3"];
        for (const v of variants) {
            master.push(`#EXT-X-STREAM-INF:BANDWIDTH=${(v.bitrate + AUDIO_KBPS) * 1000},RESOLUTION=${v.outW}x${v.outH}`);
            master.push(`${v.name}/index.m3u8`);
        }
        fs.writeFileSync(path.join(outputDir, "master.m3u8"), master.join("\n") + "\n");

        // STEP 3: upload everything to MinIO
        await uploadDir(outputDir, videoId);

        // STEP 4: finalize (duration saved here, which fixes the 0:00 badges)
        const publicBase = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT || "127.0.0.1"}:${process.env.MINIO_PORT || 9000}`;
        await Video.findByIdAndUpdate(videoId, {
            videoFile: `${publicBase}/${bucketName}/${videoId}/master.m3u8`,
            duration,
            status: "completed",
            isPublished: true,
        });

        console.log(`Video ${videoId} processed successfully`);
    } catch (error) {
        console.error("Transcoding failed:", error);
        await Video.findByIdAndUpdate(videoId, { status: "failed" });
    } finally {
        if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
        if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    }
}, {
    connection: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT) || 6379,
    },
});

worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err.message));
console.log("Worker is running and listening for jobs...");
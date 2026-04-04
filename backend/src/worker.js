import { Worker } from "bullmq";
import mongoose from "mongoose";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { Client } from "minio";
import dotenv from "dotenv";
import { Video } from "./models/videoModel.js"; 

dotenv.config({ path: "./.env" });

// 1. Connect to MongoDB (Worker needs its own connection)
mongoose.connect(`${process.env.MONGODB_URI}/VideoTube`).then(() => {
    console.log("Worker connected to MongoDB");
}).catch(err => console.error("MongoDB Connection Failed", err));

// 2. Initialize MinIO Client
const minioClient = new Client({
    endPoint: "127.0.0.1",
    port: 9000,
    useSSL: false,
    accessKey: "minioadmin", 
    secretKey: "minioadmin",
});

// Ensure bucket exists
const bucketName = "videos";
minioClient.bucketExists(bucketName, (err, exists) => {
    if (err) return console.log(err);
    if (!exists) {
        minioClient.makeBucket(bucketName, 'us-east-1', (err) => {
            if (err) return console.log(err);
            console.log(`Bucket '${bucketName}' created successfully.`);
        });
    }
});

// 3. The Processing Logic (Multi-Bitrate)
const worker = new Worker("video-transcoding", async (job) => {
    const { videoId, videoPath } = job.data;
    console.log(`Processing video: ${videoId}`);

    // Create a temporary folder structure: public/temp/{videoId}/{quality}
    const outputDir = `public/temp/${videoId}`;
    const variants = ['360p', '720p', '1080p'];
    
    // Create folders for each resolution
    variants.forEach(v => {
        const variantDir = path.join(outputDir, v);
        if (!fs.existsSync(variantDir)) {
            fs.mkdirSync(variantDir, { recursive: true });
        }
    });

    try {
        // Update DB status
        await Video.findByIdAndUpdate(videoId, { status: "processing" });

        // --- STEP 1: TRANSCODING (PARALLEL PROCESSING) ---
        // We create a helper function to run FFmpeg independently for each quality
        const transcodeQuality = (folderName, resolution, bitrate, maxrate, bufsize) => {
            return new Promise((resolve, reject) => {
                ffmpeg(videoPath)
                    .output(path.join(outputDir, folderName, 'index.m3u8'))
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .size(resolution) // This will now correctly resize the video!
                    .outputOptions([
                        '-hls_time 2',    // 2-second chunks for fast quality switching
                        '-hls_list_size 0',
                        `-b:v ${bitrate}`,
                        `-maxrate ${maxrate}`,
                        `-bufsize ${bufsize}`,
                        '-f hls'
                    ])
                    .on("end", () => {
                        console.log(`✅ Finished processing: ${folderName}`);
                        resolve();
                    })
                    .on("error", (err) => {
                        console.error(`❌ Error processing ${folderName}:`, err);
                        reject(err);
                    })
                    .run();
            });
        };

        console.log("Starting parallel transcoding...");
        
        // Run all 3 conversions at the exact same time
        await Promise.all([
            transcodeQuality('360p', '640x360', '800k', '856k', '1200k'),
            transcodeQuality('720p', '1280x720', '2500k', '2675k', '3750k'),
            transcodeQuality('1080p', '1920x1080', '5000k', '5350k', '7500k')
        ]);
        
        console.log("All transcoding finished!");

        // --- STEP 2: CREATE MASTER PLAYLIST ---
        const masterPlaylistContent = `
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8
        `.trim();

        fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterPlaylistContent);

        // --- STEP 3: UPLOAD TO MINIO ---
        const uploadFolder = async (folderName) => {
            const folderPath = path.join(outputDir, folderName);
            const files = fs.readdirSync(folderPath);
            
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const minioPath = `${videoId}/${folderName}/${file}`;
                
                const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
                
                await minioClient.fPutObject(bucketName, minioPath, filePath, { 'Content-Type': contentType });
            }
        };

        // Upload all resolution folders
        await uploadFolder('360p');
        await uploadFolder('720p');
        await uploadFolder('1080p');
        
        // Upload the Master Playlist
        await minioClient.fPutObject(
            bucketName, 
            `${videoId}/master.m3u8`, 
            path.join(outputDir, 'master.m3u8'), 
            { 'Content-Type': 'application/x-mpegURL' }
        );

        // --- STEP 4: FINALIZE ---
        const masterUrl = `http://localhost:9000/${bucketName}/${videoId}/master.m3u8`;

        await Video.findByIdAndUpdate(videoId, {
            videoFile: masterUrl,
            status: "completed",
            isPublished: true
        });

        console.log(`Video ${videoId} processed successfully with Multi-Bitrate!`);

        // Cleanup: Delete local temp files
        fs.rmSync(outputDir, { recursive: true, force: true });
        
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

    } catch (error) {
        console.error("Transcoding failed:", error);
        await Video.findByIdAndUpdate(videoId, { status: "failed" });
        
        // Cleanup on failure too
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true });
        }
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
    }
}, {
    connection: { host: "127.0.0.1", port: 6379 }
});

console.log("Worker is running and listening for jobs...");
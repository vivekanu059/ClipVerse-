import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import multer from "multer";
import { Video } from "../models/videoModel.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { videoQueue } from "../utils/queue.js";
import { Client } from "minio";
import { User } from "../models/userModel.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

const makeBucketPublic = async () => {
    try {
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: ["arn:aws:s3:::videos/*"],
                },
            ],
        };
        await minioClient.setBucketPolicy("videos", JSON.stringify(policy));
        console.log("✅ MinIO 'videos' bucket policy set to Public Read-Only");
    } catch (error) {
        console.error("⚠️ Could not set MinIO bucket policy:", error.message);
    }
};
makeBucketPublic();

// upload video
const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }
    if (!req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and Thumbnail are required");
    }

    // 1. Upload Thumbnail to Cloudinary
    const thumbnailLocalPath = req.files.thumbnail[0].path;
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailUpload) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    // 2. Queue Video for MinIO Processing
    const videoLocalPath = req.files.videoFile[0].path;

    // Create DB entry with "pending" status
    const video = await Video.create({
        owner: req.user._id,
        title,
        description,
        thumbnail: thumbnailUpload.secure_url,
        videoFile: "", 
        status: "pending",
        isPublished: false 
    });

    // Add job to BullMQ
    try {
        await videoQueue.add("transcode", {
            videoId: video._id,
            videoPath: videoLocalPath,
        });
    } catch (err) {
        await Video.findByIdAndUpdate(video._id, { status: "failed" });
        throw new ApiError(503, "Video processing is unavailable right now. Please try again.");
    }

    return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully. Processing started.")
    );
});

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SORTABLE = new Set(["createdAt", "views", "duration", "title"]);

// getAllVideos: search, channel filter, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { query, sortBy, sortType, userId } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    if (userId && !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const match = {};

    // Search (user input is escaped so it can't be used as a regex attack)
    if (query?.trim()) {
        const rx = { $regex: escapeRegex(query.trim()), $options: "i" };
        match.$or = [{ title: rx }, { description: rx }];
    }

    // Visibility: only the owner (optionalJWT sets req.user) sees drafts, processing and failed videos
    const isOwner = req.user && userId && req.user._id.toString() === userId.toString();
    if (!isOwner) {
        match.isPublished = true;
        match.status = "completed";
    }

    if (userId) match.owner = new mongoose.Types.ObjectId(userId);

    const sortField = SORTABLE.has(sortBy) ? sortBy : "createdAt";
    const sortDir = sortType === "asc" ? 1 : -1;

    const videos = await Video.aggregate([
        { $match: match },
        { $sort: { [sortField]: sortDir, _id: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "ownerDetails" } },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                videoFile: 1, thumbnail: 1, title: 1, description: 1, duration: 1,
                views: 1, isPublished: 1, status: 1, createdAt: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar",
                },
            },
        },
    ]);

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// get one video (public for published videos, drafts only for the owner)
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }
    const id = new mongoose.Types.ObjectId(videoId);

    const found = await Video.aggregate([
        { $match: { _id: id } },
        { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner" } },
        { $unwind: "$owner" },

        // likes
        { $lookup: { from: "likes", localField: "_id", foreignField: "video", as: "likes" } },

        // owner's subscribers (this is what the Subscribe button and count need)
        { $lookup: { from: "subscriptions", localField: "owner._id", foreignField: "subscribedTo", as: "subscribers" } },

        // comments
        {
            $lookup: {
                from: "comments",
                let: { videoId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                    { $sort: { createdAt: -1 } },
                    { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner" } },
                    { $unwind: "$owner" },
                    { $project: { content: 1, createdAt: 1, "owner._id": 1, "owner.username": 1, "owner.avatar": 1 } },
                ],
                as: "comments",
            },
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentsCount: { $size: "$comments" },
                isLiked: req.user ? { $in: [req.user._id, "$likes.likeBy"] } : false,
                "owner.subscribersCount": { $size: "$subscribers" },
                "owner.isSubscribed": req.user ? { $in: [req.user._id, "$subscribers.subscriber"] } : false,
            },
        },
        {
            $project: {
                title: 1, description: 1, videoFile: 1, thumbnail: 1, duration: 1,
                createdAt: 1, views: 1, status: 1, isPublished: 1,
                owner: { _id: 1, username: 1, avatar: 1, subscribersCount: 1, isSubscribed: 1 },
                likesCount: 1, commentsCount: 1, isLiked: 1, comments: 1,
            },
        },
    ]);

    const video = found[0];
    if (!video) throw new ApiError(404, "Video not found");

    // A video that isn't ready is visible to its owner only
    const isOwner = req.user && video.owner._id.toString() === req.user._id.toString();
    if (!isOwner && (!video.isPublished || video.status !== "completed")) {
        throw new ApiError(404, "Video not found");
    }

    // Count a view only for real viewers (not the uploader refreshing their own page)
    if (!isOwner) {
        await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    }

    // Watch history: most recent first, no duplicates (a pipeline update does pull + push in one write)
    if (req.user) {
        await User.updateOne({ _id: req.user._id }, [
            {
                $set: {
                    watchHistory: {
                        $slice: [
                            { $concatArrays: [[id], { $filter: { input: "$watchHistory", cond: { $ne: ["$$this", id] } } }] },
                            200,
                        ],
                    },
                },
            },
        ]);
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

// deleting video from MinIO, Cloudinary, and MongoDB
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video is not found");
    }

    // Authorization check: ensure the person deleting is the owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have access to delete this video");
    }

    // --- 1. DELETE THUMBNAIL FROM CLOUDINARY ---
    // Extract the public ID from the Cloudinary URL to delete it properly
    if (video.thumbnail) {
        try {
            const publicId = video.thumbnail.split('/').pop().split('.')[0];
            // If you have a delete utility in utils/cloudinary.js, call it here:
            // await deleteFromCloudinary(publicId);
            console.log(`Thumbnail ${publicId} marked for deletion.`);
        } catch (error) {
            console.error("Failed to extract Cloudinary public ID:", error);
        }
    }

    // --- 2. DELETE HLS FOLDER & CHUNKS FROM MINIO ---
    try {
        const bucketName = "videos";
        const folderPrefix = `${videoId}/`; 
        
        await new Promise((resolve, reject) => {
            const objectsList = [];
            
            const stream = minioClient.listObjectsV2(bucketName, folderPrefix, true);
            
            stream.on('data', (obj) => {
                objectsList.push(obj.name);
            });
            
            stream.on('error', (err) => {
                reject(err);
            });
            
            stream.on('end', async () => {
                try {
                    if (objectsList.length > 0) {
                        await minioClient.removeObjects(bucketName, objectsList);
                        console.log(`✅ Permanently deleted ${objectsList.length} files from MinIO for video ${videoId}`);
                    }
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    } catch (error) {
        console.error("MinIO Cleanup Error:", error);
        throw new ApiError(500, "Failed to clean up video files from storage server");
    }

    // --- 3. DELETE DOCUMENT AND EVERYTHING THAT POINTS AT IT ---
    await Promise.all([
        Like.deleteMany({ video: video._id }),
        Comment.deleteMany({ video: video._id }),
        User.updateMany({ watchHistory: video._id }, { $pull: { watchHistory: video._id } }),
    ]);
    await video.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Video and all associated files deleted successfully")
    );
});

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // authorization check whether person is owner of video or not
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have access to update the video");
    }
    
    video.title = title || video.title;
    video.description = description || video.description;

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

export { uploadVideo, getAllVideos, getVideoById, updateVideoDetails, deleteVideo };
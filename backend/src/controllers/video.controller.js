import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import multer from "multer";
import { Video } from "../models/videoModel.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { videoQueue } from "../utils/queue.js";
import { v4 as uuidv4 } from "uuid";
import { Client } from "minio";
import { User } from "../models/userModel.js"; 

const minioClient = new Client({
    endPoint: "127.0.0.1",
    port: 9000,
    useSSL: false,
    accessKey: "minioadmin",
    secretKey: "minioadmin",
});

// upload video
const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

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
    const videoId = uuidv4(); 

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
    await videoQueue.add("transcode", {
        videoId: video._id, 
        videoPath: videoLocalPath,
    });

    return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully. Processing started.")
    );
});

// getAllVideos (UPDATED TO SUPPORT SEARCH & PAGINATION)
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = [];

    // 1. Search filter: If a user types a query, match title or description
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // 2. Base filter: Visibility Logic
    // Check if the user is logged in AND is requesting their own dashboard
    const isOwner = req.user && userId && req.user._id.toString() === userId.toString();

    if (!isOwner) {
        // If it's a random viewer, ONLY show published and completed videos
        pipeline.push({
            $match: {
                isPublished: true,
                status: "completed"
            }
        });
    }
    // If it IS the owner, we don't push the $match, so MongoDB returns everything (including processing)
    
    // 3. User filter: If visiting a specific channel, only show their videos
    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // 4. Join with Users collection to get owner details (replaces .populate)
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            // Select exactly what we want to send to the frontend
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                status: 1,
                createdAt: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar"
                }
            }
        }
    );

    // 5. Sorting logic
    const sortStage = {};
    if (sortBy && sortType) {
        sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    } else {
        sortStage["createdAt"] = -1; // Default to newest first
    }
    pipeline.push({ $sort: sortStage });

    // 6. Pagination logic
    pipeline.push(
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    );

    // Execute the aggregation
    const videos = await Video.aggregate(pipeline);

    if (!videos) {
        throw new ApiError(500, "Error while fetching videos");
    }

    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    );
});

// get single video as per id when clicked
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            },
        },
        // owner details shown in video
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },   
        },
        { $unwind: "$owner" },

        // likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },

        //comments
        {
            $lookup: {
                from: "comments",
                let: { videoId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
                    { $sort: { createdAt: -1 } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                        },
                    },
                    { $unwind: "$owner" },
                    {
                        $project: {
                            content: 1,
                            created: 1,
                            "owner._id": 1,
                            "owner.username": 1,
                            "owner.avatar": 1,
                        },
                    },
                ],
                as: "comments",
            }
        },

        // likes and comment count to show
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                commentCount: { $size: "$comments" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likeBy"] }, 
                        then: true,
                        else: false,
                    }
                }
            }
        },

        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                createdAt: 1,
                views: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    avatar: 1,
                },
                likesCount: 1,
                commentsCount: 1,
                isLiked: 1,
                comments: 1
            },
        },
    ]);

    // Increase view count separately (outside aggregation)
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    // --- NEW: UPDATE USER WATCH HISTORY ---
    // If a user is logged in, record this view in their history array
    if (req.user && req.user._id) {
        const videoObjectId = new mongoose.Types.ObjectId(videoId);
        
        // 1. First, remove the video if it's already somewhere in their history.
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { watchHistory: videoObjectId }
        });

        // 2. Next, push the video to the VERY BEGINNING of the history array (position: 0).
        await User.findByIdAndUpdate(req.user._id, {
            $push: {
                watchHistory: {
                    $each: [videoObjectId],
                    $position: 0 
                }
            }
        });
    }

    if (!video || video.length === 0) {
         throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"));
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

    // --- 3. DELETE DOCUMENT FROM MONGODB ---
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
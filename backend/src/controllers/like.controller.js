import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

import { asyncHandler } from "../utils/asyncHandler.js";

// like a video

// like.controller.js

const likeVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // FIX: Change 'likedBy' to 'likeBy'
    const existingLike = await Like.findOne({ 
        video: videoId, 
        likeBy: req.user._id // <--- WAS likedBy
    });

    if (existingLike) {
        throw new ApiError(400, "You already liked the video");
    }

    // FIX: Change 'likedBy' to 'likeBy'
    const like = await Like.create({ 
        video: videoId, 
        likeBy: req.user._id // <--- WAS likedBy
    });

    return res.status(201).json(new ApiResponse(201, like, "Video liked Successfully"));
});

const unlikeVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // FIX: Change 'likedBy' to 'likeBy'
    const deleted = await Like.findOneAndDelete({
        video: videoId,
        likeBy: req.user._id // <--- WAS likedBy
    });

    if (!deleted) {
        throw new ApiError(404, "Like not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Video Unliked successfully"));
});

export{likeVideo,unlikeVideo};




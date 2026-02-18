import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// adding comment in any video

const addCommentInVideo=asyncHandler(async(req, res)=>{
    const {videoId}=req.params;
    // content means the comment 
    const {content}=req.body;

    if(!content?.trim()){
        throw new ApiError(400,"Comment cannot be empty");
    }
    const comment=await Comment.create({
        content,
        video:videoId,
        owner:req.user._id,
    });
    return res.status(201).json(new ApiResponse(201,comment,"comment added successfully"));

});

// get comments of a video

const getVideoComments=asyncHandler(async(req,res)=>{
    const{videoId}=req.params;

    const comments=(await Comment.find({video:videoId}).populate("owner","username fullName avatar")).sort({createdAt:-1});
    
    return res.status(200).json(new ApiResponse(200,comments,"Comments fetched successfully"));
});

// Delete comment(only done by the owner of the comment)

const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const comment =await Comment.findOneAndDelete({
        _id:commentId,
        owner:req.user._id
    });
    if(!comment){
        throw new ApiError(404,"Comment not found or not authorised");
    }
    return res.status(200).json(new ApiResponse(200,{},"Comment deleted successfully"));
});

export{addCommentInVideo,getVideoComments,deleteComment}
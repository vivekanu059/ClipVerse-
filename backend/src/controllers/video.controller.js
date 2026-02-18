import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import multer from "multer";
// video upload 

import { Video } from "../models/videoModel.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { videoQueue } from "../utils/queue.js";
import { v4 as uuidv4 } from "uuid";

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and Thumbnail are required");
    }

    // 1. Upload Thumbnail to Cloudinary (Keep existing logic)
    const thumbnailLocalPath = req.files.thumbnail[0].path;
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailUpload) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    // 2. Queue Video for MinIO Processing
    const videoLocalPath = req.files.videoFile[0].path;
    const videoId = uuidv4(); // Unique ID for this video job

    // Create DB entry with "pending" status
    const video = await Video.create({
        owner: req.user._id,
        title,
        description,
        thumbnail: thumbnailUpload.secure_url,
        videoFile: "", // Will be updated by worker
        status: "pending",
        isPublished: false 
    });

    // Add job to BullMQ
    await videoQueue.add("transcode", {
        videoId: video._id, // Pass DB ID so worker can update it
        videoPath: videoLocalPath,
    });

    return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully. Processing started.")
    );
});


// this {page and limit} is the pagination we are doing this means if we pass the page=x and limit=y in the query then it means how many pages will the results is being shown and limit means per page how many items showm
const getAllVideos=asyncHandler(async(req,res)=>{
    const{page=1,limit=10}=req.query;

    // finding videos on mongo
    const videos=await Video.find({isPublished:true})
    // more detail pagination occur form getting data is a easier and faster maanner


    .populate("owner","username avatar")    //populate joins the data between collections such that i get owner with his username and avatar from the User collection


    .sort({createdAt:-1})
// sorting form like how i get the data from the db as per timestamps ,createdAt -1 means descending like latest data first dikhega

    .skip((page-1)*limit) //formula for how the no.of content is shown as per page(like for ex u are in page 2 , and limit is 10 ,so as per formula the answer is 10 means skip(10), matlab in page 2 main first 10 ke baad wale content ko dekhunga na ,hence mongo skips the first 10 data and give form 11 to 20 in my page 2)
    .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(200,videos,"video Fetched successfully"))
});

// get single video as per id when clicked to one from entire page data

const getVideoById=asyncHandler(async(req,res)=>{
    const{videoId}=req.params;
    const video=await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)},
            },
            // owner details shown in video
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                },   
            },
            {$unwind:"$owner"},


        // likes

        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes",
            },

        },

        //comments

        {
            $lookup:{
                from:"comments",
                // important

                let:{videoId:"$_id"},
                pipeline:[
                    {$match:{$expr:{$eq:["$video","$$videoId"]}}},
                    {$sort:{createdAt:-1}},
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",

                        },
                    },
                    {$unwind:"$owner"},
                    {
                        $project:{
                            content:1,
                            created:1,
                            "owner._id":1,
                            "owner.username":1,
                            "owner.avatar":1,
                        },
                    },
                ],
                as:"comments",
                
            }
        },

        // likes and comment count to show
        {
            $addFields:{
                likesCount:{$size:"$likes"},
                commentCount:{$size:"$comments"},
                isLiked:{
                    $cond:{
                        if:{$in:[req.user?._id,"$likes.likedBy"]},
                        then:true,
                        else:false,
                    }
                }
            }
        },


        {$project:{
            title:1,
            description:1,
            videoFile:1,
            thumbnail:1,
            duration:1,
            createdAt:1,
            views:1,
            owner:{
                _id:1,
                username:1,
                avatar:1,
            },
            likesCount:1,
            commentsCount:1,
            isLiked:1,
            comments:1
        },
    },
    ]) ;
    // Increase view count separately (outside aggregation)
  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});


// deleting video from the cloudinary which is done by only the owner of the video

const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;

    const video=await Video.findById(videoId);


    if(!video){
        throw new ApiError(400,"Video is not found");
    }

    // if we get the video then authorisation check whether it is the owner of the video or not

    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You don't have access to delete this video")
    };
    // else delete the video from the cloudinary
    await video.deleteOne();

    return res.status(200).json({},"video deleted successfully")
});


const updateVideoDetails=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const{title,description}=req.body;

    const video=await Video.findById(videoId);

    if(!video){
        throw new ApiError("video not found");
    }

    // authorisation check whether person is owner of video or not
    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError("You don't have access to update the video");
    }
    video.title=title||video.title;
    video.description=description||video.description;

    await video.save();

    return res.status(200)
    .json(new ApiResponse(200,video,"video updated successfully"))
});

export{uploadVideo,getAllVideos,getVideoById,updateVideoDetails,deleteVideo};

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.model.js";



const subscribeToChannel=asyncHandler(async(req,res)=>{
    const {channelId}=req.params;

    if(req.user._id.toString()==channelId){
        throw new ApiError(400,"you can't subscribe yourself")
    };


    // check if already subscribed

    const existing=await Subscription.findOne({
        subscriber:req.user._id,
        subscribedTo:channelId
    });

    if(existing){
        throw new ApiError(400,"Already subscribed to this channel");
    }

    const subscribe=await Subscription.create({
        subscriber:req.user._id,
        subscribedTo:channelId
    });

    return res.status(201).json(new ApiResponse(201,subscribe,"channel subscribed successfully"));


});

// unsubscribe

const unsubscribeChannel=asyncHandler(async(req,res)=>{

    const {channelId}=req.params;

    const deletedChannel=await Subscription.findOneAndDelete({
        subscriber:req.user._id,
        subscribedTo:channelId
    });

    if(!deletedChannel){
        throw new ApiError(404,"you haven't subscribed to this channel");
    }
    return res.status(200).json(new ApiResponse(200,{},"Channel unsubscribed"));



});


// get all subscribers of a channel

const getAllSubscribers=asyncHandler(async(req,res)=>{
    const {channelId}=req.params;
    const subscribers=await Subscription.find({subscribedTo:channelId}).populate(
        "subscriber",    //this .populate subscriber joins the subscription models with the user model to get the data as in subscriber we use the reference of user model hence in that subscriber id is stored as value which links to any user in the user model. 
        "username, fullName,avatar"
    );
    return res.status(200).json(new ApiResponse(200,subscribers,"Subscribers fetched successfully"));
});

// get all the channels the user is subscribed to 

const getAllSubscribedChannels=asyncHandler(async(req,res)=>{
    const {userId}=req.params;
    const subscriptions=await Subscription.find({
        subscriber:userId,
    }).populate("subscribedTo","username fullName avatar coverImage");


   return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Subscribed channels fetched successfully"
      )
    );
});

export{
    subscribeToChannel,unsubscribeChannel,getAllSubscribedChannels,getAllSubscribers
}
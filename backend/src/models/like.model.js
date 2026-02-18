import mongoose from "mongoose";
const Schema=mongoose.Schema;

const likeSchema=new Schema(
    {
        likeBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },

        // which video is liked 
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video",
            required:true,
        },
    },

    {timestamps:true}
);

export const Like=mongoose.model("Like",likeSchema);


import mongoose from "mongoose";

const Schema=mongoose.Schema;

const commentSchema=new Schema(
    {
        content:{
            type:String,
            required:true,
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video",
            required:true,
        },

        // owner means who will do the comment 
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        }
    },
    {timestamps:true}
);

export const Comment=mongoose.model("Comment",commentSchema);



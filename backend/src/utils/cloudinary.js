import {v2 as cloudinary } from "cloudinary";
import fs from "fs"



cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET

});

const uploadOnCloudinary=async (localFilePath)=>{
try{
    if(!localFilePath)return null
    //else upload the file on cloudinary:
   const response= await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
        
    }); 
    // //after file uploaded sucessfully:
    // console.log("file is uploaded on the cloudinary",response.url);

    fs.unlinkSync(localFilePath);
    return response;

}catch(error){
    fs.unlinkSync(localFilePath)//remove the local saved file because uploading not done
    return null;
}
};

export {uploadOnCloudinary};
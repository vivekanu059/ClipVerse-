import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {uploadVideo,getAllVideos,getVideoById,updateVideoDetails,deleteVideo} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middlewares.js";

const router =Router();
// upload video routes

router.route("/upload").post(verifyJWT,upload.fields(
    [{name:"videoFile",maxCount:1},{name:"thumbnail",maxCount:1}]
),uploadVideo);

// get all video

router.route("/").get(getAllVideos);

// get specific video
router.route("/:videoId").get(getVideoById);

// update&delete

router.route("/:videoId").put(verifyJWT,upload.single("thumbnail"),updateVideoDetails);

router.route("/:videoId").delete(
    verifyJWT,deleteVideo
);

export default router;

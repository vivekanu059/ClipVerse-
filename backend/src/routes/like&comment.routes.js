import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import{addCommentInVideo,getVideoComments,deleteComment} from "../controllers/comments.controller.js"
import{likeVideo,unlikeVideo} from "../controllers/like.controller.js";

const router=Router();
// likes
router.route("/videos/:videoId/like").post(verifyJWT, likeVideo);
router.route("/videos/:videoId/unlike").delete(verifyJWT, unlikeVideo);

// Comments
router.route("/videos/:videoId/comments").post(verifyJWT, addCommentInVideo);
router.route("/videos/:videoId/comments").get(getVideoComments);
router.route("/comments/:commentId").delete(verifyJWT, deleteComment);

export default router;

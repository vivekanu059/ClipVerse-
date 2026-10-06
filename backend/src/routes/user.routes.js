import{Router} from "express";
import {loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassord, getCurrentUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {verifyJWT, optionalJWT} from "../middlewares/auth.middleware.js";
import { clearWatchHistory } from "../controllers/user.controllers.js";
import { googleAuth } from "../controllers/user.controllers.js";

const router =Router();

router.route("/register").post(
  upload.fields([
{
  name:"avatar",
  maxCount:1
},
{
  name:"coverImage",
  maxCount:1

}

  ]),
  registerUser,
)
router.route("/google-auth").post(googleAuth);
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,logoutUser);
 router.route("/refresh-Token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassord);

router.route("/current-user").get(verifyJWT,getCurrentUser);

// patch is used because we don't want to update all the data , we just need to install the limited data,hence patch used
router.route("/update-account").patch(verifyJWT,updateAccountDetails);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route("/cover-Image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/c/:username").get(optionalJWT,getUserChannelProfile);

router.route("/History").get(verifyJWT,getWatchHistory);
router.route("/history/clear").delete(verifyJWT, clearWatchHistory);


export default router
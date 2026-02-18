import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import{
     subscribeToChannel,unsubscribeChannel,getAllSubscribedChannels,getAllSubscribers
} from "../controllers/subscription.controllers.js";

const router=Router();
// subscribe or unsubscribe any channel

router.route("/subscribe/:channelId").post(verifyJWT,subscribeToChannel);

router.route("/unsubscribe/:channelId").delete(verifyJWT,unsubscribeChannel);

// get all subscribers
router.route("/channel/:channelId/subscribers").get(getAllSubscribers);

// get all channels subscribed

router.route("/user/:userId/subscriptions").get(getAllSubscribedChannels);

export default router;


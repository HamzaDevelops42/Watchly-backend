import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Toggle subscription to a channel
router.post("/channel/:channelId", toggleSubscription);

// Get all subscribers of a channel (only accessible by the channel owner)
router.get("/channel/:channelId/subscribers", getUserChannelSubscribers);

// Get all channels a user has subscribed to (only accessible by the user)
router.get("/user/:subscriberId", getSubscribedChannels);

export default router
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload, uploadVideoAndThumbnail } from "../middlewares/multer.middleware.js"
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    incrementVideoView,
    publishAVideo,
    togglePublishStatus,
    updateVideo
} from "../controllers/video.controller.js";


const router = Router()

router.route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        uploadVideoAndThumbnail.fields([
            {
                name: "videoFile",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]),
        publishAVideo
    )


router.route("/:videoId")
    .get(getVideoById)
    .patch(verifyJWT, uploadVideoAndThumbnail.single("thumbnail"), updateVideo)
    .delete(verifyJWT, deleteVideo)

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus)
router.route("/:videoId/view", incrementVideoView)

export default router
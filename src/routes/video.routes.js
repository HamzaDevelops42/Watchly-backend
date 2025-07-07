import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload, uploadVideoAndThumbnail } from "../middlewares/multer.middleware.js"
import {
    getAllVideos,
    publishAVideo
} from "../controllers/video.controller.js";


const router = Router()

router
    .route("/")
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
    
    

export default router
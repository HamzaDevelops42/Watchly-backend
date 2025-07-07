import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import {
    getAllVideos,
    publishAVideo
} from "../controllers/video.controller.js";


const router = Router()

router
    .route("/")
    .get(getAllVideos)
    
    
    

export default router
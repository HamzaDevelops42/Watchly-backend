import multer from "multer"
import { ApiError } from "../utils/ApiError.js"

// Common storage
const storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, "./public/temp")
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname)
        }
    }
)

const upload = multer({
    storage
})


// File filter for video and thumbnail
const videoAndThumbnailFilter = function (req, file, cb) {
    const allowedThumbnailTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    const allowedVideoTypes = ["video/mp4", "video/mkv", "video/webm"]

    if (
        (file.fieldname === "thumbnail" && allowedThumbnailTypes.includes(file.mimetype)) ||
        (file.fieldname === "videoFile" && allowedVideoTypes.includes(file.mimetype))
    ) {
        cb(null, true)
    } else {
        cb(new ApiError(400, `Unsupported file type for ${file.fieldname}`), false)
    }
}

// Multer instance for video + thumbnail with size limits
const uploadVideoAndThumbnail = multer({
    storage,
    fileFilter: videoAndThumbnailFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit per file
    }
})




export { upload, uploadVideoAndThumbnail }
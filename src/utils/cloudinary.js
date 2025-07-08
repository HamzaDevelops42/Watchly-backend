import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const getPublicIdFromUrl = (url) => {
    const publicUrl = url.split("/upload/")[1]
    const noVersion = publicUrl.replace(/^v\d+\//, "")
    const publicId = noVersion.replace(/\.[^/.]+$/, "")
    return publicId
};


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })


        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;

    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
            } catch { }
        }
        // console.log("CLoudinary ERROR: ",error)
        return null
    }
}

const deleteFromCloudinary = async (cloudinaryUrl, resourceType = "image") => {
    try {
        if (!cloudinaryUrl) return null;

        const publicId = getPublicIdFromUrl(cloudinaryUrl);

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType, 
            invalidate: true
        });

        return response;
    } catch (error) {
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary }
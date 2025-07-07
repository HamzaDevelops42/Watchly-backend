import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResopnse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const sortField = sortBy || "createdAt";
    const sortOrder = parseInt(sortType, 10) === 1 ? 1 : -1;

    const pipeline = [{ $match: { isPublished: true } }]

    if (query && query.trim() !== "") {
        pipeline.push(
            {
                $match: {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } }
                    ]
                }
            }
        )
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        }
    )

    pipeline.push(
        {
            $sort: {
                [sortField]: sortOrder
            }
        }
    )

    pipeline.push(
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        }
    )

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            docs: "videos"
        }
    };


    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Videos fetched successfully"
            )
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body


    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    if (!req.files?.videoFile?.[0] || !req.files?.thumbnail?.[0]) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(req.files.videoFile[0].path)
    const thumbnail = await uploadOnCloudinary(req.files.thumbnail[0].path)


    if (!videoFile) {
        throw new ApiError(500, "Error while uploading video")
    }


    if (!thumbnail) {
        throw new ApiError(500, "Error while uploading thumbnail")
    }

    const video = await Video.create({
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        title,
        description,
        duration: videoFile.duration || 0,
        owner: req.user._id
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                video,
                "Video Uploaded Successfully"
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is missing")
    }

    const video = await Video.findById(videoId).populate({
        path: "owner",
        select: "username fullName avatar"
    })
        .select("-__v")


    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
            )
        )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!title && !description && !req.file?.path) {
        throw new ApiError(400, "No update data provided");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have access to update this video")
    }


    // Update title and description only if they are provided
    if (title?.trim()) {
        video.title = title
    }

    if (description?.trim()) {
        video.description = description
    }


    // Update thumbnail only if a new file is provided
    if (req.file?.path) {

        const thumbnail = await uploadOnCloudinary(req.file.path)

        if (!thumbnail?.secure_url) {
            throw new ApiError(500, "Error while uplaoding thumbnail")
        }


        //Delete old thumbnail
        if (video.thumbnail) {
            const isDeleted = await deleteFromCloudinary(video.thumbnail)
            if (!isDeleted) {
                throw new ApiError(500, "Error while deleting old thumbnail")
            }
        }

        video.thumbnail = thumbnail.secure_url
    }


    const updatedVideo = await video.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video Updated successfully"
            )
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
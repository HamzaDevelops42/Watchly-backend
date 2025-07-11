import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id

    const totalVideos = await Video.countDocuments({ owner: userId })

    const videos = await Video.find({ owner: userId }, "views").lean()
    const totalViews = videos.reduce((acc, video) => acc + (video.views || 0), 0)

    const videoIds = videos.map(video => video._id)
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } })

    const totalSubscribers = await Subscription.countDocuments({ channel: userId })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    totalVideos,
                    totalViews,
                    totalLikes,
                    totalSubscribers
                },
                "Channel stats fetched successfully"
            )
        )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    const userId = req.user._id.toString()

    const sortField = sortBy || "createdAt"
    const sortOrder = parseInt(sortType, 10) === 1 ? 1 : -1

    const pipeline = [{ $match: { owner: new mongoose.Types.ObjectId(userId) } }]

    if (query && query.trim() !== "") {
        pipeline.push(
            {
                $match: {
                    $or: [
                        { title: { $regex: query.trim(), $options: "i" } },
                        { description: { $regex: query.trim(), $options: "i" } }
                    ]
                }
            }
        )
    }

    pipeline.push({
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
                        avatar: 1
                    }
                }
            ]
        }
    })

    pipeline.push({
        $addFields: {
            owner: { $first: "$owner" }
        }
    })

    pipeline.push({
        $sort: {
            [sortField]: sortOrder
        }
    })

    pipeline.push({
        $project: {
            __v: 0
        }
    })

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            docs: "videos"
        }
    }


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

export {
    getChannelStats,
    getChannelVideos
}
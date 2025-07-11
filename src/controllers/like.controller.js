import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const videoExists = await Video.findById(videoId);
    if (!videoExists) throw new ApiError(404, "Video not found");

    if(!videoExists.isPublished){
        throw new ApiError(400, "Video is not published")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        video: videoId.trim()
    })

    let status

    if (existingLike) {
        await existingLike.deleteOne()
        status = "Unliked"
    } else {
        await Like.create({
            video: videoId.trim(),
            likedBy: req.user._id
        })
        status = "Liked"
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { status },
                `${status} successfully`
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const commentExists = await Comment.findById(commentId);
    if (!commentExists) throw new ApiError(404, "Comment not found");

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId.trim()
    })

    let status

    if (existingLike) {
        await existingLike.deleteOne()
        status = "Unliked"
    } else {
        await Like.create({
            comment: commentId.trim(),
            likedBy: req.user._id
        })
        status = "Liked"
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { status },
                `${status} successfully`
            )
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const tweetExists = await Tweet.findById(tweetId);
    if (!tweetExists) throw new ApiError(404, "Tweet not found");

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId.trim()
    })

    let status

    if (existingLike) {
        await existingLike.deleteOne()
        status = "Unliked"
    } else {
        await Like.create({
            tweet: tweetId.trim(),
            likedBy: req.user._id
        })
        status = "Liked"
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { status },
                `${status} successfully`
            )
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortType } = req.query
    const sortOrder = parseInt(sortType, 10) === 1 ? 1 : -1

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            docs: "videos"
        }
    }

    const likedVideos = await Like.aggregatePaginate(
        Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(req.user._id.toString()),
                    video: { $exists: true }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "video",
                    pipeline: [
                        {
                            $match: { isPublished: true }
                        },
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
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: { $first: "$owner" }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                description: 1,
                                views: 1,
                                createdAt: 1,
                                owner: 1,
                                duration: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    video: { $first: "$video" }
                }
            },
            {
                $match: {
                    video: { $ne: null }
                }
            },
            {
                $sort: {
                    createdAt: sortOrder
                }
            },
            {
                $project: {
                    video: 1,
                    likedBy: 1,
                    createdAt: 1
                }
            }
        ]),
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "liked videos fetched successfully"
            )
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
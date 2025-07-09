import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })


    const populatedTweet = await Tweet.findById(tweet._id).populate({
        path: "owner",
        select: "fullName username avatar"
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                populatedTweet,
                "Tweet created successfully"
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10, sortBy, sortType } = req.query

    const sortField = sortBy || "createdAt"
    const sortOrder = parseInt(sortType, 10) === 1 ? 1 : -1


    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const isUser = await User.findById(userId)

    if (!isUser) {
        throw new ApiError(404, "User does not exist")
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            docs: "tweets"
        }
    }


    const tweets = await Tweet.aggregatePaginate(
        Tweet.aggregate([
            {
                $match: { owner: new mongoose.Types.ObjectId(userId.toString()) }
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
                                avatar: 1,
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
                $sort: {
                    [sortField]: sortOrder
                }
            },

            {
                $project: {
                    _id: 1,
                    content: 1,
                    owner: 1,
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
                tweets,
                "Tweets fetched successfully"
            )
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (req.user._id.toString() !== tweet.owner.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    tweet.content = content.trim()
    await tweet.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Tweet updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (req.user._id.toString() !== tweet.owner.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    const result = await tweet.deleteOne()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deleted: result.deletedCount === 1 },
                "Tweet deleted successfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
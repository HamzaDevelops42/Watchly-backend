import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResopnse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Id is not valid")
    }

    if (channelId === req.user._id) {
        throw new ApiError(400, "You can not subscribe to yourself")
    }

    const subscription = await Subscription.findOne(
        {
            subscriber: req.user._id,
            channel: channelId
        }
    )

    let result

    if (subscription) {

        await subscription.deleteOne()
        result = "Unsubscribed"

    } else if (!subscription) {

        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })
        result = "Subscribed"
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                `Channel ${result.toLowerCase()} successfully`
            )
        )


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const { page = 1, limit = 10, sortBy, sortType } = req.query

    const sortField = sortBy || "createdAt"
    const sortOrder = parseInt(sortType, 10) === 1 ? 1 : -1

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const isChannel = await User.findById(channelId)

    if (!isChannel) {
        throw new ApiError(404, "Channel does not exist")
    }

    if (req.user._id.toString() !== channelId) {
        throw new ApiError(403, "You dont have access to this")
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            docs: "subscribers"
        }
    }


    const list = await Subscription.aggregatePaginate(
        Subscription.aggregate([
            {
                $match: { channel: channelId }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriber",
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
                    subscriber: { $first: "$subscriber" }
                }
            },

            {
                $sort: {
                    [sortField]: sortOrder
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
                list,
                "Subscribers fetched successfully"
            )
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    const { subscriberId } = req.params
    const { page = 1, limit = 10, sortBy, sortType } = req.query

    const sortField = sortBy || "createdAt"
    const sortOrder = parseInt(sortType, 10) === 1 ? 1 : -1

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const isUser = await User.findById(subscriberId)

    if (!isUser) {
        throw new ApiError(404, "User does not exist")
    }

    if (req.user._id.toString() !== subscriberId) {
        throw new ApiError(403, "You dont have access to this")
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            docs: "channels"
        }
    }

    const list = await Subscription.aggregatePaginate(
        Subscription.aggregate([
            {
                $match: { subscriber: subscriberId }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channel",
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
                    channel: { $first: "$channel" }
                }
            },

            {
                $sort: {
                    [sortField]: sortOrder
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
                list,
                "Subscribed channels fetched successfully"
            )
        )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
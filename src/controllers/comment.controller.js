import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { page = 1, limit = 10, sortType } = req.query

    const sortOrder = parseInt(sortType, 10) === 1 ? 1 : -1

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const isVideo = await Video.findById(videoId)

    if (!isVideo) {
        throw new ApiError(404, "video does not exist")
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            docs: "comments"
        }
    }


    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            {
                $match: { video: new mongoose.Types.ObjectId(videoId.toString()) }
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
                    "createdAt": sortOrder
                }
            },

            {
                $project: {
                    _id: 1,
                    content: 1,
                    owner: 1,
                    video: 1,
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
                comments,
                "Comments fetched successfully"
            )
        )

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const isVideo = await Video.findById(videoId)

    if (!isVideo) {
        throw new ApiError(404, "video does not exist")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    await comment.populate("owner", "username fullName avatar")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "Comment posted successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Id is not valid")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    comment.content = content.trim()

    const updatedComment = await comment.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment updated successfully"
            )
        )

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    const result = await comment.deleteOne()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deleted: result.deletedCount === 1 },
                "Comment deleted successfully"
            )
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
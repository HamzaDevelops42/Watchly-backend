import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description is required")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist created successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Id is not valid")
    }

    if (req.user._id.toString() !== userId) {
        throw new ApiError(403, "You dont have access to this")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId.toString()) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "publishedVideos",
                pipeline: [
                    {
                        $match: { isPublished: true }
                    }
                ]
            }
        },
        {
            $addFields: { videoCount: { $size: "$publishedVideos" } }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                videoCount: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "Playlists fetched successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Id is not valid")
    }
    const existingPlaylist = await Playlist.findById(playlistId)

    if (!existingPlaylist) {
        throw new ApiError(404, "playlist not found")
    }

    if (req.user._id.toString() !== existingPlaylist.owner.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId.toString()) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $match: {
                            isPublished: true // Only fetch published videos
                        }
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
                                },
                                { $limit: 1 }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist[0],
                "Playlist fetched successfully"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    const alreadyExists = playlist.videos.some(
        (vid) => vid.toString() === videoId
    )

    if (alreadyExists) {
        throw new ApiError(400, "Video is already present in the playlist");
    }


    const isVideo = await Video.findById(videoId)

    if (!isVideo) {
        throw new ApiError(404, "Video not found")
    }

    playlist.videos.unshift(videoId)

    const updatedPlaylist = await playlist.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video added successfully"
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    const index = playlist.videos.findIndex(
        (vid) => vid.toString() === videoId
    )

    if (index === -1) {
        throw new ApiError(404, "Video is not present in the playlist");
    }

    playlist.videos.splice(index, 1);

    const updatedPlaylist = await playlist.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video removed successfully"
            )
        )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Id is not valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    const result = await playlist.deleteOne()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { deleted: result.deletedCount === 1 },
                "playlist deleted successfully"
            )
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Id is not valid")
    }

    if (!name?.trim() && !description?.trim()) {
        throw new ApiError(400, "Name or description is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have access to this")
    }

    if (name?.trim()) {
        playlist.name = name.trim()
    }

    if (description?.trim()) {
        playlist.description = description.trim()
    }

    const updatedPlaylist = await playlist.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req, _, next) => {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

    if(!accessToken){
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedAccessToken._id).select("-password -refreshToken")

    if(!user){
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user
    next()
})
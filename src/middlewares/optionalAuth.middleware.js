import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

// Optional JWT: attaches req.user if token is valid, skips silently if not
export const optionalJWT = asyncHandler(async (req, _, next) => {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "").trim();

    if (!accessToken) {
        return next(); // No token provided, proceed as guest
    }

    try {
        const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedAccessToken._id).select("-password -refreshToken");

        if (user) {
            req.user = user; // Attach user if found and token is valid
        }
    } catch (error) {
        // Invalid token — skip silently without throwing error
    }

    next();
});

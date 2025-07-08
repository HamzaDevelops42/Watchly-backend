import { ApiError } from "../utils/ApiError.js"

export const errorHandler = (err, req, res, next) => {
    // console.log(err)
    if(err instanceof ApiError){
        return res
        .status(err.statusCode)
        .json({
            statusCode: err.statusCode,
            message: err.message,
            errors: err.error,
            success: err.success,
            data: err.data
        })
    }

    // Handle all other unknown or internal server errors
    return res.status(500).json({
        statusCode: 500,
        message: err.message || "Internal Server Error",
        errors: [],
        success: false,
        data: null
    })
}
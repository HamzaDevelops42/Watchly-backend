import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({  limit: "16kb"  }))
app.use(express.urlencoded({extended: true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Routes Imports
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"

//Routes Declaration
app.use("/api/users", userRouter)
app.use("/api/videos", videoRouter)




app.use(errorHandler)

export { app }
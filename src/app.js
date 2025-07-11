import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middlewares/error.middleware.js"

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
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import commentRouter from "./routes/comment.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//Routes Declaration
app.use("/api/users", userRouter)
app.use("/api/videos", videoRouter)
app.use("/api/subscriptions", subscriptionRouter)
app.use("/api/tweets", tweetRouter)
app.use("/api/comments", commentRouter)
app.use("/api/playlist", playlistRouter)
app.use("/api/likes", likeRouter)
app.use("/api/healthcheck", healthcheckRouter)
app.use("/api/dashboard", dashboardRouter)

app.use(errorHandler)

export { app }
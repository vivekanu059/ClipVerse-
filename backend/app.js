import express from "express";
import cookieParser from "cookie-parser"
const app=express()
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
import cors from "cors"

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:"16kb"}));


//importing routes

// app.js
// ... imports

// Routes
import userRouter from "./src/routes/user.routes.js";
import videoRouter from "./src/routes/video.routes.js";
import subscriptionRouter from "./src/routes/subscription.routes.js";
import likeAndCommentRouter from "./src/routes/like&comment.routes.js"; 

// Mount routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);

// Fix: Mount this at the root api level because your router handles the specific paths
// Your router file has paths like "/videos/:videoId/like"
// So if you mount at "/api/v1", the result is "/api/v1/videos/:videoId/like"
app.use("/api/v1", likeAndCommentRouter); 

export { app };
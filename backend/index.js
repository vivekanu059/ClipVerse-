import dotenv from "dotenv";
import mongoose from "mongoose";
import { app } from "./app.js";

// 1. Load the environment variables
// IMPORTANT: Make sure your file is actually named ".env" (with the dot)
dotenv.config({
    path: "./.env"
});

const connectDB = async () => {
    try {
        // Debugging: Check if the variable is loaded
        console.log("Attempting to connect to:", process.env.MONGODB_URI); 

        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing in .env file");
        }

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/VideoTube`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT || 8000}`);
        });
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1);
    }
};

connectDB();
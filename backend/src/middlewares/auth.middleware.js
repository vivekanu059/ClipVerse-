import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //  Find user in DB
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token"); 
    }

    // Attach user to request
    req.user = user;

    // Continue
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid access token");
  }
});

// For public pages that show extra info when you ARE logged in (isLiked, isSubscribed, your own drafts).
// Never rejects: no token or a bad token just means "guest".
const optionalJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded?._id).select("-password -refreshToken");
      if (user) req.user = user;
    }
  } catch {
    // ignore, treat as guest
  }
  next();
});

export { verifyJWT, optionalJWT };
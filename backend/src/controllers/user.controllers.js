import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// google auth
const googleAuth = asyncHandler(async (req, res) => {
    const { credential } = req.body; // The token sent from React

    if (!credential) {
        throw new ApiError(400, "Google token is missing");
    }

    // 1. Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    // 2. Extract user data from Google's payload
    const { email, name, picture, sub: googleId } = ticket.getPayload();

    // 3. Check if the user already exists in your database
    let user = await User.findOne({ email });

    if (!user) {
        // 4. If they don't exist, create a new account!
        // We generate a random password since they use Google to log in
        const generatedPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        
        // Create a unique username based on their name
        const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`;

        user = await User.create({
            fullName: name,
            email: email,
            username: uniqueUsername,
            password: generatedPassword, // They won't use this, but your schema requires it
            avatar: picture,
            coverImage: "", 
        });
    }

    // 5. Generate your app's standard JWTs (Reusing your existing function!)
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // 6. Send the exact same response as your normal login User!
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "Google authentication successful"
            )
        );
});
// -------------------------------------------------------------------------

// Generate Access & Refresh Token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    // We don’t want to run validations again while saving only refreshToken
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Issue in generating refresh and access token");
  }
};

// --- COOKIE OPTIONS CONFIGURATION ---
// secure: true in production (HTTPS), false in dev (HTTP)
const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "Lax"
};

// register 
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already registered");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage = "";
  
  if (coverImageLocalPath) {
      const uploadedCover = await uploadOnCloudinary(coverImageLocalPath);
      coverImage = uploadedCover?.url || "";
  }

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage,
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// login
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email) || !password) {
    throw new ApiError(400, "Username/Email and password are required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    // Updated cookie options here
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// logout
const logoutUser = asyncHandler(async (req, res) => {
  // Remove refresh token from DB for security
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  return res
    .status(200)
    // Updated cookie options here
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
   
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorised request");
    }
    
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
      
    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }
    
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }
      
    // generateAccessAndRefreshToken returns { accessToken, refreshToken }, so rename it here
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);
      
    return res.status(200)
      // Updated cookie options here
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        new ApiResponse(
          200, 
          { accessToken, refreshToken: newRefreshToken }, 
          "AccessToken is refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token");
  }
});

const changeCurrentPassord = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confPassword } = req.body;

    if (!(newPassword == confPassword)) {
        throw new ApiError(400, "password does not match"); // Changed 401 to 400 (Bad Request)
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(new ApiResponse(200, {}, "new password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiResponse(200, req.user, "current user Fetched Successfully"));
});

// updating account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  // Validation
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true, // return the updated document
    }
  ).select("-password"); // exclude password from result

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});


// updating avatar and coverImage
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error in uploding on avatar");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true,
        }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});


const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "the coverImage is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "ERROR in uploading");
  }
  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscribedTo",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      }
    }

  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  return res.status(200).json(
    new ApiResponse(200, channel[0], "User channel fetched successfully")
  );
});


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate({
            path: "watchHistory",
            populate: {
                path: "owner",
                select: "username fullName avatar"
            }
        });

    return res.status(200)
        .json(new ApiResponse(200, user.watchHistory, "Watch history fetched successfully"));
});
// Clear the user's entire watch history
const clearWatchHistory = asyncHandler(async (req, res) => {
    // Find the user and set their watchHistory array to empty
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { watchHistory: [] }
        },
        { new: true }
    );

    return res.status(200)
        .json(new ApiResponse(200, [], "Watch history cleared successfully"));
});

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassord, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateCoverImage, 
    getUserChannelProfile, 
    getWatchHistory ,
    clearWatchHistory,
    googleAuth
};
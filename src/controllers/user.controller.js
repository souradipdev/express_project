import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/users.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});


    return {accessToken, refreshToken};
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
}

const registerUser = asyncHandler(async (req, res) => {

  // get user details from frontend
  // validation - not empty
  // check whether the user is already registered using username and email
  // check for images and check for avatars
  // upload avatar and coverImage to cloudinary
  // create an user object and upload to db
  // remove password and refresh token filed from response
  // check user
  // return res
  // console.log(fullName);

  const {fullName, email, username, password} = req.body;

  if (!fullName || !email || !username || !password || [fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{username}, {email}]
  });

  // console.log(User);

  if (existingUser) {
    throw new ApiError(409, "user with email or username already exists");
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImagePath = req.files?.coverImage[0]?.path;
  // console.log(req.files.coverImage.length); // cannot read properties of undefined

  let avatarLocalPath;
  if (req.files && Array.isArray(req.files.avatar) && (req.files.avatar.length > 0)) {
    avatarLocalPath = req.files.avatar[0].path;
  } else {
    throw new ApiError(400, "Avatar file required");
  }

  let coverImagePath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImagePath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImagePath);
  // console.log(avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar file not uploaded to cloudinary");
  }


  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async function (req, res) {
  // req body data
  // get username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const {username, password} = req.body;

  if (!username || !password || [username, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields required");
  }

  const user = await User.findOne({
    $or: [{username}, {password}]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const passwordValid = await user.isPasswordCorrect(password);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const option = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
      )
    );
})


export {registerUser, loginUser};

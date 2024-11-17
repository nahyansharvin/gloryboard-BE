import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();

    return { accessToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

const registerAdmin = asyncHandler(async (req, res) => {
  const { email, name, password, number, department, year_of_study } = req.body;

  if (
    [email, name, password, number, department, year_of_study].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { number }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with this username or email already exists");
  }

  try {
    const user = await User.create({
      user_type: "admin",
      name,
      email,
      number,
      password,
      department,
      year_of_study,
    });

    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
      throw new ApiError(500, "Failed to create user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User created successfully"));
  } catch (error) {
    console.log(error, "Error creating user");
    throw new ApiError(500, "Something went wrong while creating user");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const {
    email,
    name,
    password,
    number,
    department,
    year_of_study,
    user_type,
  } = req.body;

  if (
    [email, name, password, number, department, year_of_study, user_type].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { number }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with this username or email already exists");
  }

  try {
    const user = await User.create({
      user_type,
      name,
      email,
      number,
      password,
      department,
      year_of_study,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -__v -createdAt -updatedAt"
    );

    if (!createdUser) {
      throw new ApiError(500, "Failed to create user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User created successfully"));
  } catch (error) {
    console.log(error, "Error creating user");
    throw new ApiError(500, "Something went wrong while creating user");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  const { accessToken } = await generateAccessToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password");

  if (!loggedInUser) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User logged in successfully"
      )
    );
});

const fetchAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password");

  if (!users) {
    throw new ApiError(404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.query;

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully"));
});

export {
  registerAdmin,
  registerUser,
  loginUser,
  fetchAllUsers,
  deleteUserById,
};

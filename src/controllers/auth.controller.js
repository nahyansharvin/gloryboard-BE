import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerAdmin = asyncHandler(async (req, res) => {
  const requiredFields = [
    "name",
    "password",
    "gender",
    "number",
    "department",
    "year_of_study",
  ];

  const { name, password, number, department, year_of_study } = req.body;

  if (requiredFields.some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ number }],
  });
  if (existingUser) {
    throw new ApiError(409, "User with this number already exists");
  }

  try {
    const user = await User.create({
      user_type: "admin",
      ...req.body,
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
  const requiredFields = {
    rep: [
      "name",
      "number",
      "password",
      "gender",
      "department",
      "year_of_study",
    ],
    member: ["gender", "name", "number", "department", "year_of_study"],
  };

  const {
    name,
    number,
    password,
    department,
    year_of_study,
    user_type,
    gender,
  } = req.body;

  if (!requiredFields[user_type]) {
    throw new ApiError(400, "Invalid user type");
  }

  if (
    requiredFields[user_type].some(
      (field) => !req.body[field] || req.body[field].toString().trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ number }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this number already exists");
  }

  try {
    const user = await User.create(req.body);

    const createdUser = await User.findById(user._id).select(
      "-password -__v -created_at -updated_at"
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

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.query;
  const { name, number, department, year_of_study, gender } = req.body;

  if (
    [name, number, department, year_of_study].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: { gender, name, number, department, year_of_study } },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res

    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { number, password } = req.body;

  if (!number || !password) {
    throw new ApiError(400, "Number and password are required");
  }

  const user = await User.findOne({ number });
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

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

export const authController = {
  registerAdmin,
  registerUser,
  updateUser,
  loginUser,
  getCurrentUser,
};

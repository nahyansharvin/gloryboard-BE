import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DEPARTMENTS } from "../constants.js";





const fetchAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select(
    "-password -__v -created_at -updated_at"
  );

  if (!users) {
    throw new ApiError(404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const fetchAllReps = asyncHandler(async (req, res) => {
  const users = await User.find({ user_type: "rep" }).select(
    "-password -__v -created_at -updated_at"
  );

  if (!users) {
    throw new ApiError(404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const fetchAllMembers = asyncHandler(async (req, res) => {
  let users;

  if (req.user.user_type === "rep") {
    users = await User.find({ department: req.user.department }).select(
      "-password -__v -created_at -updated_at"
    );
  } else if (req.user.user_type === "admin") {
    users = await User.find({ user_type: "member" }).select(
      "-password -__v -created_at -updated_at"
    );
  }

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

const fetchDepartments = asyncHandler(async (req, res, next) => {
  res.status(200).json(new ApiResponse(200, DEPARTMENTS, "Departments found"));
});

export {
  registerAdmin,
  registerUser,
  updateUser,
  loginUser,
  getCurrentUser,
  fetchAllUsers,
  fetchAllReps,
  fetchAllMembers,
  deleteUserById,
  fetchDepartments,
};

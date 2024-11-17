import { Router } from "express";
import {
  loginUser,
  registerAdmin,
  registerUser,
  updateUser,
  getCurrentUser,
  fetchAllUsers,
  deleteUserById,
  fetchAllReps,
} from "../controllers/user.controllers.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middlewares.js";

const router = Router();

// public routes
router.route("/registerAdmin").post(registerAdmin);
router.route("/login").post(loginUser);
router.route("/").get(fetchAllUsers);

// Protucted Router
router.route("/register").post(verifyJWT, verifyRole(["admin"]), registerUser);
router.route("/update").put(verifyJWT, verifyRole(["admin"]), updateUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/reps").get(verifyJWT, verifyRole(["admin"]), fetchAllReps);
router
  .route("/delete")
  .get(verifyJWT, verifyRole(["admin , rep"], deleteUserById));

export default router;

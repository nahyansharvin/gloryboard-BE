import { Router } from "express";
import {
  loginUser,
  registerAdmin,
  registerUser,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// public routes
router.route("/registerAdmin").post(registerAdmin);
router.route("/login").post(loginUser);

// Protucted Router
router.route("/register").post(verifyJWT, registerUser);

export default router;

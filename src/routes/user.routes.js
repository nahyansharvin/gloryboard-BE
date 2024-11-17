import { Router } from "express";
import {
  loginUser,
  registerAdmin,
  registerUser,
  fetchAllUsers,
  deleteUserById,
} from "../controllers/user.controllers.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middlewares.js";

const router = Router();

// public routes
router.route("/registerAdmin").post(registerAdmin);
router.route("/login").post(loginUser);
router.route("/").get(fetchAllUsers);

// Protucted Router
router.route("/register").post(verifyJWT, verifyRole(["admin"]), registerUser);
router.route("/delete").get( verifyJWT , verifyRole(["admin , rep"] ,deleteUserById ));

export default router;

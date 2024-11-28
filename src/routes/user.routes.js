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
  fetchAllMembers,
  fetchDepartments,
} from "../controllers/user.controller.js";

import {
  fetchAllResults,
  fetchResultById,
  fetchResultByEventId,
  fetchAllIndividualResults,
  fetchLeaderboard,
} from "../controllers/result.controller.js";

import { fetchAllEvents } from "../controllers/event.controller.js";

import { verifyJWT, verifyRole } from "../middlewares/auth.middlewares.js";
import { DEPARTMENTS } from "../constants.js";

const router = Router();

// public routes
router.route("/registerAdmin").post(registerAdmin);
router.route("/login").post(loginUser);
router.route("/").get(fetchAllUsers);

router.route("/events").get(fetchAllEvents);

router.route("/results").get(fetchAllResults);
router.route("/result/:id").get(fetchResultById);
router.route("/result/event/:event_id").get(fetchResultByEventId);

// router.route("/results/group").get(fetchAllGroupResults);
router.route("/results/single").get(fetchAllIndividualResults);
router.route("/results/leaderboard").get(fetchLeaderboard);

// Protucted Router
router.route("/register").post(verifyJWT, verifyRole(["admin" , "rep"]), registerUser);
router.route("/update").put(verifyJWT, verifyRole(["admin"]), updateUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/reps").get(verifyJWT, verifyRole(["admin"]), fetchAllReps);
router
  .route("/members")
  .get(verifyJWT, verifyRole(["admin", "rep"]), fetchAllMembers);
router
  .route("/delete")
  .get(verifyJWT, verifyRole(["admin", "rep"]), deleteUserById);

router
  .route("/departments")
  .get(verifyJWT, verifyRole(["admin", "rep"]), fetchDepartments);

export default router;

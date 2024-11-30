import { Router } from "express";
import { registerAdmin } from "../controllers/user.controller";

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
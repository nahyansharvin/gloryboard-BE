import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.middlewares.js";
import {
  fetchAllEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
} from "../controllers/eventType.controller.js";
import {
  fetchAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";

import {
  getAllEventRegistrations,
  createEventRegistration,
  getEventRegistrationById,
  updateEventRegistration,
  deleteEventRegistration,
} from "../controllers/eventRegistration.controller.js";

const router = Router();

router.use(verifyJWT, verifyRole(["admin"]));

// Event Type routes
router.route("/event-type").get(fetchAllEventTypes);
router.route("/event-type").post(createEventType);
router.route("/event-type/update/:id").patch(updateEventType);
router.route("/event-type/delete/:id").delete(deleteEventType);

// Event routes
router.route("/events").get(fetchAllEvents);
router.route("/events").post(createEvent);
router.route("/events/update/:id").patch(updateEvent);
router.route("/events/delete/:id").delete(deleteEvent);

// event registration routes

router.route("/event-registration").get(getAllEventRegistrations);
router.route("/event-registration").post(createEventRegistration);
router.route("/event-registration/:id").get(getEventRegistrationById);
router.route("/event-registration/update/:id").patch(updateEventRegistration);
router.route("/event-registration/delete/:id").delete(deleteEventRegistration);

export default router;

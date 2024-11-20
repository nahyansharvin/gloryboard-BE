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

export default router;

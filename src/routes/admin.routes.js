import { Router } from "express";
import { verifyJWT , verifyRole  } from "../middlewares/auth.middlewares.js";
import { fetchAllEventTypes , createEventType } from "../controllers/event.controller.js";
const router = Router();

router.use(verifyJWT, verifyRole(["admin"]));

router.route("/event-type").get(fetchAllEventTypes);
router.route("/event-type").post(createEventType);


export default router;
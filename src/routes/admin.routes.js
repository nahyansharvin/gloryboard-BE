import { Router } from "express";
import { verifyJWT , verifyRole  } from "../middlewares/auth.middlewares.js";
import { fetchAllEventTypes , createEventType , updateEventType , deleteEventType} from "../controllers/event.controller.js";
const router = Router();

router.use(verifyJWT, verifyRole(["admin"]));

router.route("/event-type").get(fetchAllEventTypes);
router.route("/event-type").post(createEventType);
router.route("/event-type/update/:id").patch(updateEventType);
router.route("/event-type/delete/:id").delete(deleteEventType);



export default router;
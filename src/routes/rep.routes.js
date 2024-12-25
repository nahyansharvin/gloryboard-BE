import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { userController } from "../controllers/user.controller.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT, verifyRole(["admin", "rep"]));


router.route("/register").post(authController.registerUser);
router.route("/update").put(authController.updateUser);
router.route("/me").get(authController.getCurrentUser);

router.route("/members").get(userController.fetchAllMembers);
router.route("/delete").get(userController.deleteUserById);

export default router;

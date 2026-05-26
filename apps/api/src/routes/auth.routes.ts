import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { auth } from "../middlewares/auth";

const router = Router();
const controller = new AuthController();

router.post("/register", controller.register.bind(controller));
router.post("/login", controller.login.bind(controller));
router.get("/me", auth, controller.me.bind(controller));
router.patch("/me", auth, controller.updateMe.bind(controller));

export { router as authRoutes };

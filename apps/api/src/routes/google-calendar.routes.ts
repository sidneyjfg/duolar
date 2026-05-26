import { Router } from "express";
import { GoogleCalendarController } from "../controllers/GoogleCalendarController";
import { auth } from "../middlewares/auth";

const router = Router();
const controller = new GoogleCalendarController();

router.get("/", auth, controller.list.bind(controller));
router.get("/connect", auth, controller.connect.bind(controller));
router.get("/callback", controller.callback.bind(controller));
router.delete("/:id", auth, controller.disconnect.bind(controller));

export { router as googleCalendarRoutes };

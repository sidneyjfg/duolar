import { Router } from "express";
import { TaskController } from "../controllers/TaskController";

const router = Router();
const controller = new TaskController();

router.get("/", controller.list.bind(controller));
router.post("/", controller.create.bind(controller));
router.get("/balance", controller.balance.bind(controller));
router.get("/day", controller.day.bind(controller));
router.patch("/:id/complete", controller.completeOnDate.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export { router as taskRoutes };

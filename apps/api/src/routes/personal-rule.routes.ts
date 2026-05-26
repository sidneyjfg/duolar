import { Router } from "express";
import { PersonalRuleController } from "../controllers/PersonalRuleController";

const router = Router();
const controller = new PersonalRuleController();

router.get("/", controller.list.bind(controller));
router.post("/", controller.create.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.patch("/:id/check-in", controller.checkIn.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export { router as personalRuleRoutes };

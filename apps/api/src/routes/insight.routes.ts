import { Router } from "express";
import { InsightController } from "../controllers/InsightController";

const router = Router();
const controller = new InsightController();

router.get("/", controller.list.bind(controller));

export { router as insightRoutes };

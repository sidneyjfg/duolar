import { Router } from "express";
import { FinanceController } from "../controllers/FinanceController";

const router = Router();
const controller = new FinanceController();

router.get("/", controller.list.bind(controller));
router.post("/", controller.create.bind(controller));
router.get("/summary", controller.summary.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export { router as financeRoutes };

import { Router } from "express";
import { ShoppingController } from "../controllers/ShoppingController";

const router = Router();
const controller = new ShoppingController();

router.get("/", controller.list.bind(controller));
router.post("/", controller.create.bind(controller));
router.get("/history", controller.history.bind(controller));
router.post("/finish", controller.finish.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export { router as shoppingRoutes };

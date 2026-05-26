import { Router } from "express";
import { AgendaController } from "../controllers/AgendaController";

const router = Router();
const controller = new AgendaController();

router.get("/", controller.list.bind(controller));
router.post("/", controller.create.bind(controller));
router.patch("/:id", controller.update.bind(controller));
router.delete("/:id", controller.remove.bind(controller));

export { router as agendaRoutes };

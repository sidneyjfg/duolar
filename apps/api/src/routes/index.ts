import { Router } from "express";
import { auth } from "../middlewares/auth";
import { agendaRoutes } from "./agenda.routes";
import { authRoutes } from "./auth.routes";
import { financeRoutes } from "./finance.routes";
import { insightRoutes } from "./insight.routes";
import { googleCalendarRoutes } from "./google-calendar.routes";
import { personalRuleRoutes } from "./personal-rule.routes";
import { shoppingRoutes } from "./shopping.routes";
import { taskRoutes } from "./task.routes";

export const routes = Router();

routes.get("/health", (_req, res) => res.json({ status: "ok", app: "DuoLar" }));
routes.use("/auth", authRoutes);
routes.use("/agenda", auth, agendaRoutes);
routes.use("/integrations/google-calendar", googleCalendarRoutes);
routes.use("/tasks", auth, taskRoutes);
routes.use("/shopping", auth, shoppingRoutes);
routes.use("/finances", auth, financeRoutes);
routes.use("/personal-rules", auth, personalRuleRoutes);
routes.use("/insights", auth, insightRoutes);

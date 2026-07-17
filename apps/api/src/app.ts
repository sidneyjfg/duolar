import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { env } from "./config/env";
import { AppError } from "./errors/AppError";
import { requireCsrf } from "./http/auth";
import { formatHttpError } from "./http/errors";
import { applySecurityHeaders } from "./http/security";
import { agendaRoutes } from "./routes/agenda.routes";
import { authRoutes } from "./routes/auth.routes";
import { financeRoutes } from "./routes/finance.routes";
import { googleCalendarRoutes } from "./routes/google-calendar.routes";
import { insightRoutes } from "./routes/insight.routes";
import { personalRuleRoutes } from "./routes/personal-rule.routes";
import { shoppingRoutes } from "./routes/shopping.routes";
import { taskRoutes } from "./routes/task.routes";

export const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: env.webOrigin,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CSRF-Token"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    })
  )
  .onRequest(({ set }) => {
    applySecurityHeaders(set.headers);
  })
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    const isMutation = ["POST", "PATCH", "DELETE"].includes(request.method);
    const isPublicAuth = url.pathname === "/api/auth/login" || url.pathname === "/api/auth/register";
    if (!isMutation || isPublicAuth) return;

    const headers = Object.fromEntries(request.headers.entries());
    const origin = headers.origin;
    if (origin && origin !== env.webOrigin) throw new AppError("Origem inválida", 403);
    requireCsrf(headers);
  })
  .onError(({ error, set }) => formatHttpError(error, set))
  .get("/health", () => ({ status: "ok", app: "DuoLar" }))
  .use(authRoutes)
  .use(agendaRoutes)
  .use(financeRoutes)
  .use(googleCalendarRoutes)
  .use(insightRoutes)
  .use(personalRuleRoutes)
  .use(shoppingRoutes)
  .use(taskRoutes);

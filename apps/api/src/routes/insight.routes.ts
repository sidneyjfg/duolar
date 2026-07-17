import { Elysia } from "elysia";
import { requireUser } from "../http/auth";
import { InsightService } from "../services/InsightService";

const service = new InsightService();

export const insightRoutes = new Elysia({ prefix: "/insights" }).get("/", async ({ headers }) => {
  const user = await requireUser(headers);
  return service.list(user);
});

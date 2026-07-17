import { Elysia } from "elysia";
import { env } from "../config/env";
import { requireUser } from "../http/auth";
import { GoogleCalendarService } from "../services/GoogleCalendarService";

const service = new GoogleCalendarService();

export const googleCalendarRoutes = new Elysia({ prefix: "/integrations/google-calendar" })
  .get("/", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.listConnections(user);
  })
  .get("/connect", async ({ headers, query }) => {
    const user = await requireUser(headers);
    return service.getConnectUrl(user, String(query.responsible ?? ""));
  })
  .get("/callback", async ({ query }) => {
    await service.handleCallback(String(query.code ?? ""), String(query.state ?? ""));
    return Response.redirect(`${env.webOrigin}/?googleCalendar=connected`, 302);
  })
  .delete("/:id", async ({ headers, params }) => {
    const user = await requireUser(headers);
    return service.disconnect(user, params.id);
  });

import { Elysia } from "elysia";
import { AgendaEventDto } from "../dtos/AgendaDto";
import { requireUser } from "../http/auth";
import { AgendaService } from "../services/AgendaService";
import { validateDto } from "../utils/validate";

const service = new AgendaService();

export const agendaRoutes = new Elysia({ prefix: "/agenda" })
  .get("/", async ({ headers, query }) => {
    const user = await requireUser(headers);
    return service.list(user, query.date ? String(query.date) : undefined);
  })
  .post("/", async ({ body, headers, set }) => {
    const user = await requireUser(headers);
    const data = await validateDto(AgendaEventDto, body);
    set.status = 201;
    return service.create(user, data);
  })
  .patch("/:id", async ({ body, headers, params }) => {
    const user = await requireUser(headers);
    return service.update(user, params.id, body as Partial<AgendaEventDto>);
  })
  .delete("/:id", async ({ headers, params }) => {
    const user = await requireUser(headers);
    return service.remove(user, params.id);
  });

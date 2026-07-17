import { Elysia } from "elysia";
import { PersonalRuleDto } from "../dtos/PersonalRuleDto";
import { requireUser } from "../http/auth";
import { PersonalRuleService } from "../services/PersonalRuleService";
import { validateDto } from "../utils/validate";

const service = new PersonalRuleService();

export const personalRuleRoutes = new Elysia({ prefix: "/personal-rules" })
  .get("/", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.list(user);
  })
  .post("/", async ({ body, headers, set }) => {
    const user = await requireUser(headers);
    const data = await validateDto(PersonalRuleDto, body);
    set.status = 201;
    return service.create(user, data);
  })
  .patch("/:id", async ({ body, headers, params }) => {
    const user = await requireUser(headers);
    return service.update(user, params.id, body as Partial<PersonalRuleDto>);
  })
  .patch("/:id/check-in", async ({ body, headers, params }) => {
    const user = await requireUser(headers);
    const payload = body as { date?: string; completed?: boolean } | undefined;
    return service.checkIn(user, params.id, payload?.date, payload?.completed ?? true);
  })
  .delete("/:id", async ({ headers, params }) => {
    const user = await requireUser(headers);
    return service.remove(user, params.id);
  });

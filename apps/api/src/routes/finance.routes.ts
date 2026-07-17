import { Elysia } from "elysia";
import { FinanceDto } from "../dtos/FinanceDto";
import { requireUser } from "../http/auth";
import { FinanceService } from "../services/FinanceService";
import { validateDto } from "../utils/validate";

const service = new FinanceService();

export const financeRoutes = new Elysia({ prefix: "/finances" })
  .get("/", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.list(user);
  })
  .post("/", async ({ body, headers, set }) => {
    const user = await requireUser(headers);
    const data = await validateDto(FinanceDto, body);
    set.status = 201;
    return service.create(user, data);
  })
  .get("/summary", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.summary(user);
  })
  .patch("/:id", async ({ body, headers, params }) => {
    const user = await requireUser(headers);
    return service.update(user, params.id, body as Partial<FinanceDto>);
  })
  .delete("/:id", async ({ headers, params }) => {
    const user = await requireUser(headers);
    return service.remove(user, params.id);
  });

import { Elysia } from "elysia";
import { TaskDto } from "../dtos/TaskDto";
import { requireUser } from "../http/auth";
import { TaskService } from "../services/TaskService";
import { validateDto } from "../utils/validate";

const service = new TaskService();

export const taskRoutes = new Elysia({ prefix: "/tasks" })
  .get("/", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.list(user);
  })
  .post("/", async ({ body, headers, set }) => {
    const user = await requireUser(headers);
    const data = await validateDto(TaskDto, body);
    set.status = 201;
    return service.create(user, data);
  })
  .get("/balance", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.balance(user);
  })
  .get("/day", async ({ headers, query }) => {
    const user = await requireUser(headers);
    return service.day(user, String(query.date ?? ""));
  })
  .patch("/:id/complete", async ({ body, headers, params }) => {
    const user = await requireUser(headers);
    const payload = body as { date?: string; completed?: boolean } | undefined;
    return service.completeOnDate(user, params.id, payload?.date, payload?.completed ?? true);
  })
  .patch("/:id", async ({ body, headers, params }) => {
    const user = await requireUser(headers);
    return service.update(user, params.id, body as Partial<TaskDto>);
  })
  .delete("/:id", async ({ headers, params }) => {
    const user = await requireUser(headers);
    return service.remove(user, params.id);
  });

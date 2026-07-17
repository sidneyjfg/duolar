import { Elysia } from "elysia";
import { FinishPurchaseDto, ShoppingItemDto, UpdateShoppingItemDto } from "../dtos/ShoppingDto";
import { requireUser } from "../http/auth";
import { ShoppingService } from "../services/ShoppingService";
import { validateDto } from "../utils/validate";

const service = new ShoppingService();

export const shoppingRoutes = new Elysia({ prefix: "/shopping" })
  .get("/", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.list(user);
  })
  .post("/", async ({ body, headers, set }) => {
    const user = await requireUser(headers);
    const data = await validateDto(ShoppingItemDto, body);
    set.status = 201;
    return service.create(user, data);
  })
  .get("/history", async ({ headers }) => {
    const user = await requireUser(headers);
    return service.history(user);
  })
  .post("/finish", async ({ body, headers, set }) => {
    const user = await requireUser(headers);
    const data = await validateDto(FinishPurchaseDto, body);
    set.status = 201;
    return service.finishPurchase(user, data);
  })
  .patch("/:id", async ({ body, headers, params }) => {
    const user = await requireUser(headers);
    const data = await validateDto(UpdateShoppingItemDto, body);
    return service.update(user, params.id, data);
  })
  .delete("/:id", async ({ headers, params }) => {
    const user = await requireUser(headers);
    return service.remove(user, params.id);
  });

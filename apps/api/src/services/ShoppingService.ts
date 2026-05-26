import { FinishPurchaseDto, ShoppingItemDto } from "../dtos/ShoppingDto";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";

function assignDefined<T extends object>(target: T, values: Partial<T>) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) Object.assign(target, { [key]: value });
  }
}

export class ShoppingService {
  async list(user: User) {
    return repositories.shopping().find({ where: { user: { id: user.id } }, order: { name: "ASC" } });
  }

  async create(user: User, data: ShoppingItemDto) {
    return repositories.shopping().save(repositories.shopping().create({ ...data, user }));
  }

  async update(user: User, id: string, data: Partial<ShoppingItemDto>) {
    const repo = repositories.shopping();
    const item = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!item) throw new AppError("Item não encontrado", 404);
    const { name, quantity, category, estimatedPrice, actualPrice, checked, cartStatus, purchased, notes } = data;
    assignDefined(item, { name, quantity, category, estimatedPrice, actualPrice, checked, cartStatus, purchased, notes });
    return repo.save(item);
  }

  async remove(user: User, id: string) {
    const repo = repositories.shopping();
    const item = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!item) throw new AppError("Item não encontrado", 404);
    await repo.remove(item);
    return { ok: true };
  }

  async finishPurchase(user: User, data: FinishPurchaseDto) {
    const items = await this.list(user);
    const session = repositories.purchases().create({
      user,
      total: data.total,
      estimatedTotal: data.estimatedTotal,
      difference: Number(data.total) - Number(data.estimatedTotal),
      items
    });
    await repositories.purchases().save(session);
    await repositories.shopping().update({ user: { id: user.id } }, { purchased: true, checked: true, cartStatus: "purchased" });
    return session;
  }

  async history(user: User) {
    return repositories.purchases().find({ where: { user: { id: user.id } }, order: { createdAt: "DESC" } });
  }
}

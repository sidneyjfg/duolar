import { FinishPurchaseDto, ShoppingItemDto } from "../dtos/ShoppingDto";
import { ShoppingItem } from "../entities/ShoppingItem";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";

function assignDefined<T extends object>(target: T, values: Partial<T>) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) Object.assign(target, { [key]: value });
  }
}

function money(value: unknown, fallback = 0) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, 0), 1_000_000);
}

function normalizeItemData(data: Partial<ShoppingItemDto>, current?: ShoppingItem) {
  const actualPrice = data.actualPrice === undefined ? current?.actualPrice : money(data.actualPrice);
  const estimatedPrice = data.estimatedPrice === undefined ? current?.estimatedPrice : money(data.estimatedPrice);
  const cartStatus = data.cartStatus ?? (Number(actualPrice ?? 0) > 0 ? "cart" : current?.cartStatus ?? "pending");

  return {
    ...data,
    name: data.name?.trim(),
    quantity: data.quantity?.trim() || undefined,
    estimatedPrice,
    actualPrice,
    checked: data.checked ?? (Number(actualPrice ?? 0) > 0 ? true : undefined),
    cartStatus,
    notes: data.notes?.trim() || undefined
  };
}

export class ShoppingService {
  async list(user: User) {
    return repositories.shopping().find({ where: { user: { id: user.id } }, order: { name: "ASC" } });
  }

  async create(user: User, data: ShoppingItemDto) {
    const normalized = normalizeItemData(data);
    return repositories.shopping().save(repositories.shopping().create({ ...normalized, user }));
  }

  async update(user: User, id: string, data: Partial<ShoppingItemDto>) {
    const repo = repositories.shopping();
    const item = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!item) throw new AppError("Item não encontrado", 404);
    const normalized = normalizeItemData(data, item);
    const { name, quantity, category, estimatedPrice, actualPrice, checked, cartStatus, purchased, notes } = normalized;
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
    const purchasedItems = items.filter((item) => item.cartStatus === "cart" || Number(item.actualPrice) > 0);
    if (!purchasedItems.length) throw new AppError("Nenhum item no carrinho", 422);
    const session = repositories.purchases().create({
      user,
      total: data.total,
      estimatedTotal: data.estimatedTotal,
      difference: Number(data.total) - Number(data.estimatedTotal),
      items: purchasedItems
    });
    await repositories.purchases().save(session);
    await Promise.all(
      purchasedItems.map((item) =>
        repositories.shopping().update({ id: item.id, user: { id: user.id } }, { purchased: true, checked: true, cartStatus: "purchased" })
      )
    );
    return session;
  }

  async history(user: User) {
    return repositories.purchases().find({ where: { user: { id: user.id } }, order: { createdAt: "DESC" } });
  }
}

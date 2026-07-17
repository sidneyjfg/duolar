import { FinanceDto } from "../dtos/FinanceDto";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";

function assignDefined<T extends object>(target: T, values: Partial<T>) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) Object.assign(target, { [key]: value });
  }
}

export class FinanceService {
  async list(user: User) {
    return repositories.finances().find({ where: { user: { id: user.id } }, order: { billingMonth: "DESC", dueDate: "DESC", date: "DESC" } });
  }

  async create(user: User, data: FinanceDto) {
    return repositories.finances().save(repositories.finances().create({ ...data, user }));
  }

  async update(user: User, id: string, data: Partial<FinanceDto>) {
    const repo = repositories.finances();
    const item = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!item) throw new AppError("Registro não encontrado", 404);
    const { title, amount, type, category, date, paymentKind, paymentName, dueDate, billingMonth, notes, responsible, sharing } = data;
    assignDefined(item, { title, amount, type, category, date, paymentKind, paymentName, dueDate, billingMonth, notes, responsible, sharing });
    return repo.save(item);
  }

  async remove(user: User, id: string) {
    const repo = repositories.finances();
    const item = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!item) throw new AppError("Registro não encontrado", 404);
    await repo.remove(item);
    return { ok: true };
  }

  async summary(user: User) {
    const rows = await this.list(user);
    const income = rows.filter((row) => row.type === "income").reduce((sum, row) => sum + Number(row.amount), 0);
    const expense = rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + Number(row.amount), 0);
    const byCategory = rows.reduce<Record<string, number>>((acc, row) => {
      if (row.type === "expense") acc[row.category] = (acc[row.category] ?? 0) + Number(row.amount);
      return acc;
    }, {});
    return { income, expense, balance: income - expense, byCategory };
  }
}

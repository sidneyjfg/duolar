import { PersonalRuleDto } from "../dtos/PersonalRuleDto";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";

function assignDefined<T extends object>(target: T, values: Partial<T>) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) Object.assign(target, { [key]: value });
  }
}

function normalizeDate(date?: string) {
  return date || new Date().toISOString().slice(0, 10);
}

export class PersonalRuleService {
  async list(user: User) {
    return repositories.personalRules().find({ where: { user: { id: user.id } }, order: { status: "ASC", title: "ASC" } });
  }

  async create(user: User, data: PersonalRuleDto) {
    return repositories.personalRules().save(
      repositories.personalRules().create({
        ...data,
        completedDates: data.completedDates ?? [],
        status: data.status ?? "active",
        user
      })
    );
  }

  async update(user: User, id: string, data: Partial<PersonalRuleDto>) {
    const repo = repositories.personalRules();
    const rule = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!rule) throw new AppError("Regra não encontrada", 404);

    const { title, category, conditionText, rewardText, consequenceText, status, completedDates } = data;
    assignDefined(rule, { title, category, conditionText, rewardText, consequenceText, status, completedDates });
    return repo.save(rule);
  }

  async checkIn(user: User, id: string, datePayload?: string, completed = true) {
    const repo = repositories.personalRules();
    const rule = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!rule) throw new AppError("Regra não encontrada", 404);

    const date = normalizeDate(datePayload);
    const dates = new Set(rule.completedDates ?? []);
    if (completed) dates.add(date);
    else dates.delete(date);
    rule.completedDates = Array.from(dates).sort();
    return repo.save(rule);
  }

  async remove(user: User, id: string) {
    const repo = repositories.personalRules();
    const rule = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!rule) throw new AppError("Regra não encontrada", 404);
    await repo.remove(rule);
    return { ok: true };
  }
}

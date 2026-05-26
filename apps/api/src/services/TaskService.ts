import { TaskDto } from "../dtos/TaskDto";
import { Task, TaskWeight } from "../entities/Task";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";

const weightScore: Record<TaskWeight, number> = {
  simples: 1,
  medio: 3,
  pesado: 5
};

const weekDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function scoreTask(task: Pick<Task, "weight" | "mentalEffort" | "domesticImpact">) {
  return (weightScore[task.weight] ?? 1) + Number(task.mentalEffort) + Number(task.domesticImpact);
}

function assignDefined<T extends object>(target: T, values: Partial<T>) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) Object.assign(target, { [key]: value });
  }
}

function normalizeDate(date?: string) {
  return date || new Date().toISOString().slice(0, 10);
}

function isTaskDueOn(task: Task, date: string) {
  if (task.dueDate === date) return true;

  const target = new Date(`${date}T00:00:00`);
  const weekday = weekDays[target.getUTCDay()];
  const scheduledDays = task.scheduledDays ?? [];

  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly") return scheduledDays.includes(weekday);
  if (task.recurrence === "monthly" && task.dueDate) {
    return Number(task.dueDate.slice(8, 10)) === target.getUTCDate();
  }

  return false;
}

export class TaskService {
  async list(user: User) {
    return repositories.tasks().find({ where: { user: { id: user.id } }, order: { dueDate: "ASC" } });
  }

  async create(user: User, data: TaskDto) {
    const task = repositories.tasks().create({
      ...data,
      mentalEffort: data.mentalEffort ?? 1,
      domesticImpact: data.domesticImpact ?? 1,
      priority: data.priority ?? "medium",
      completedDates: data.completedDates ?? [],
      scheduledDays: data.scheduledDays ?? [],
      user
    });
    return repositories.tasks().save(task);
  }

  async update(user: User, id: string, data: Partial<TaskDto>) {
    const repo = repositories.tasks();
    const task = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!task) throw new AppError("Tarefa não encontrada", 404);
    const { title, description, weight, mentalEffort, domesticImpact, priority, recurrence, dueDate, scheduledDays, completedDates, responsible, completed } = data;
    assignDefined(task, { title, description, weight, mentalEffort, domesticImpact, priority, recurrence, dueDate, scheduledDays, completedDates, responsible, completed });
    return repo.save(task);
  }

  async remove(user: User, id: string) {
    const repo = repositories.tasks();
    const task = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!task) throw new AppError("Tarefa não encontrada", 404);
    await repo.remove(task);
    return { ok: true };
  }

  async completeOnDate(user: User, id: string, datePayload?: string, completed = true) {
    const repo = repositories.tasks();
    const task = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!task) throw new AppError("Tarefa não encontrada", 404);

    const date = normalizeDate(datePayload);
    const dates = new Set(task.completedDates ?? []);
    if (completed) dates.add(date);
    else dates.delete(date);

    task.completedDates = Array.from(dates).sort();
    task.completed = task.completedDates.length > 0;
    return repo.save(task);
  }

  async day(user: User, datePayload?: string) {
    const date = normalizeDate(datePayload);
    const tasks = await this.list(user);
    const due = tasks.filter((task) => isTaskDueOn(task, date));
    const done = due.filter((task) => (task.completedDates ?? []).includes(date));
    const pending = due.filter((task) => !(task.completedDates ?? []).includes(date));

    return {
      date,
      totals: {
        due: due.length,
        done: done.length,
        pending: pending.length
      },
      due,
      done,
      pending
    };
  }

  async balance(user: User) {
    const tasks = await this.list(user);
    const totals = tasks.reduce<Record<string, number>>((acc, task) => {
      const score = scoreTask(task);
      acc[task.responsible] = (acc[task.responsible] ?? 0) + score;
      return acc;
    }, {});
    const total = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;
    const distribution = Object.entries(totals).map(([name, score]) => ({
      name,
      score,
      percentage: Math.round((score / total) * 100)
    }));
    const overloaded = distribution.find((item) => item.percentage >= 65);
    return {
      distribution,
      status: overloaded ? "overload" : "balanced",
      insight: overloaded
        ? `${overloaded.name} está com ${overloaded.percentage}% da carga doméstica`
        : "Distribuição equilibrada"
    };
  }
}

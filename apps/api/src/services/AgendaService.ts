import { AgendaEventDto } from "../dtos/AgendaDto";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";
import { GoogleCalendarService } from "./GoogleCalendarService";

function assignDefined<T extends object>(target: T, values: Partial<T>) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) Object.assign(target, { [key]: value });
  }
}

export class AgendaService {
  private googleCalendar = new GoogleCalendarService();

  async list(user: User, date?: string) {
    const where = date ? { user: { id: user.id }, date } : { user: { id: user.id } };
    return repositories.agenda().find({ where, order: { date: "ASC", startTime: "ASC" } });
  }

  async create(user: User, data: AgendaEventDto) {
    const event = await repositories.agenda().save(repositories.agenda().create({ ...data, responsible: data.responsible ?? "Casa", user }));
    await this.googleCalendar.syncEvent(user, event);
    return event;
  }

  async update(user: User, id: string, data: Partial<AgendaEventDto>) {
    const repo = repositories.agenda();
    const event = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!event) throw new AppError("Evento não encontrado", 404);

    const { title, category, date, startTime, endTime, responsible, location, notes, completed } = data;
    assignDefined(event, { title, category, date, startTime, endTime, responsible, location, notes, completed });
    const saved = await repo.save(event);
    await this.googleCalendar.syncEvent(user, saved);
    return saved;
  }

  async remove(user: User, id: string) {
    const repo = repositories.agenda();
    const event = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!event) throw new AppError("Evento não encontrado", 404);
    await this.googleCalendar.deleteEventSyncs(event.id);
    await repo.remove(event);
    return { ok: true };
  }
}

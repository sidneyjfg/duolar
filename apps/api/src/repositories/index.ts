import { AppDataSource } from "../config/data-source";
import { Finance } from "../entities/Finance";
import { PurchaseSession } from "../entities/PurchaseSession";
import { ShoppingItem } from "../entities/ShoppingItem";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { AgendaEvent } from "../entities/AgendaEvent";
import { PersonalRule } from "../entities/PersonalRule";
import { GoogleCalendarConnection } from "../entities/GoogleCalendarConnection";
import { GoogleCalendarEventSync } from "../entities/GoogleCalendarEventSync";
import { Invite } from "../entities/Invite";
import { Session } from "../entities/Session";

export const repositories = {
  users: () => AppDataSource.getRepository(User),
  tasks: () => AppDataSource.getRepository(Task),
  shopping: () => AppDataSource.getRepository(ShoppingItem),
  purchases: () => AppDataSource.getRepository(PurchaseSession),
  finances: () => AppDataSource.getRepository(Finance),
  agenda: () => AppDataSource.getRepository(AgendaEvent),
  personalRules: () => AppDataSource.getRepository(PersonalRule),
  googleCalendarConnections: () => AppDataSource.getRepository(GoogleCalendarConnection),
  googleCalendarEventSyncs: () => AppDataSource.getRepository(GoogleCalendarEventSync),
  sessions: () => AppDataSource.getRepository(Session),
  invites: () => AppDataSource.getRepository(Invite)
};

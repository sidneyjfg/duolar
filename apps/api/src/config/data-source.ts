import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";
import { env } from "./env";
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

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.database,
  synchronize: false,
  logging: false,
  entities: [User, Task, ShoppingItem, PurchaseSession, Finance, AgendaEvent, PersonalRule, GoogleCalendarConnection, GoogleCalendarEventSync, Session, Invite],
  migrations: [path.join(__dirname, "../migrations/*.{js,ts}")]
});

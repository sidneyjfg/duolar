import crypto from "crypto";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { env } from "../config/env";
import { AgendaEvent } from "../entities/AgendaEvent";
import { GoogleCalendarConnection } from "../entities/GoogleCalendarConnection";
import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";

const scopes = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email"];

type OAuthState = {
  sub: string;
  responsible: string;
};

function normalizeResponsible(name?: string) {
  return (name || "Casa").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function encryptionKey() {
  return crypto.createHash("sha256").update(env.google.tokenEncryptionKey ?? env.jwtSecret).digest();
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(value: string) {
  const payload = Buffer.from(value, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, mins + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function asDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

export class GoogleCalendarService {
  private ensureEnabled() {
    if (!env.google.calendarEnabled) {
      throw new AppError("Google Calendar indisponível por revisão de segurança", 503);
    }
  }

  private oauthClient() {
    this.ensureEnabled();
    if (!env.google.clientId || !env.google.clientSecret) {
      throw new AppError("Google Calendar não configurado", 503);
    }
    return new google.auth.OAuth2(env.google.clientId, env.google.clientSecret, env.google.redirectUri);
  }

  async listConnections(user: User) {
    this.ensureEnabled();
    const connections = await repositories.googleCalendarConnections().find({
      where: { user: { id: user.id } },
      order: { responsible: "ASC" }
    });
    const events = await repositories.agenda().find({ where: { user: { id: user.id } } });
    const syncRepo = repositories.googleCalendarEventSyncs();

    return Promise.all(
      connections.map(async (connection) => {
        const syncs = await syncRepo.find({
          where: { connection: { id: connection.id } },
          order: { updatedAt: "DESC" }
        });
        const relevantEvents = this.eventsForConnection(events, connection.responsible);
        const syncedEvents = syncs.filter((sync) => sync.status === "synced").length;
        const failedSyncs = syncs.filter((sync) => sync.status === "failed");
        return {
          id: connection.id,
          responsible: connection.responsible,
          googleEmail: connection.googleEmail,
          calendarId: connection.calendarId,
          syncStatus: failedSyncs.length ? "failed" : relevantEvents.length === syncedEvents ? "synced" : "pending",
          totalEvents: relevantEvents.length,
          syncedEvents,
          failedEvents: failedSyncs.length,
          lastSyncAt: syncs[0]?.updatedAt,
          lastError: failedSyncs[0]?.lastError,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt
        };
      })
    );
  }

  getConnectUrl(user: User, responsible: string) {
    this.ensureEnabled();
    const trimmedResponsible = responsible.trim();
    if (!trimmedResponsible) throw new AppError("Responsável é obrigatório", 400);
    const state = jwt.sign({ sub: user.id, responsible: trimmedResponsible } satisfies OAuthState, env.jwtSecret, { expiresIn: "10m" });
    return {
      url: this.oauthClient().generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: scopes,
        state
      })
    };
  }

  async handleCallback(code?: string, state?: string) {
    this.ensureEnabled();
    if (!code || !state) throw new AppError("Callback Google inválido", 400);

    let payload: OAuthState;
    try {
      payload = jwt.verify(state, env.jwtSecret) as OAuthState;
    } catch {
      throw new AppError("Estado OAuth inválido ou expirado", 400);
    }

    const user = await repositories.users().findOneBy({ id: payload.sub });
    if (!user) throw new AppError("Usuário não encontrado", 404);

    const oauthClient = this.oauthClient();
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new AppError("Google não retornou refresh token. Remova o acesso antigo do app no Google e conecte novamente.", 400);
    }
    oauthClient.setCredentials(tokens);

    const userInfo = await google.oauth2({ version: "v2", auth: oauthClient }).userinfo.get();
    const googleEmail = userInfo.data.email;
    if (!googleEmail) throw new AppError("Não foi possível identificar o e-mail Google conectado", 400);

    const repo = repositories.googleCalendarConnections();
    const existing = await repo.findOne({ where: { user: { id: user.id }, responsible: payload.responsible } });
    const connection = existing ?? repo.create({ user, responsible: payload.responsible });

    connection.googleEmail = googleEmail;
    connection.calendarId = "primary";
    connection.accessToken = encrypt(tokens.access_token);
    connection.refreshToken = encrypt(tokens.refresh_token);
    connection.tokenExpiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

    await repo.save(connection);
    await this.syncExistingEventsForConnection(user, connection);
    return connection;
  }

  async disconnect(user: User, id: string) {
    const repo = repositories.googleCalendarConnections();
    const connection = await repo.findOne({ where: { id, user: { id: user.id } } });
    if (!connection) throw new AppError("Conexão Google Calendar não encontrada", 404);
    await repo.remove(connection);
    return { ok: true };
  }

  async syncEvent(user: User, event: AgendaEvent) {
    if (!env.google.calendarEnabled) return;
    let targetConnections = await this.targetConnections(user, event.responsible);
    if (!targetConnections.length) return;

    const syncRepo = repositories.googleCalendarEventSyncs();
    const existingSyncs = await syncRepo.find({
      where: { agendaEvent: { id: event.id } },
      relations: { connection: true }
    });
    const targetIds = new Set(targetConnections.map((connection) => connection.id));

    await Promise.all(
      existingSyncs
        .filter((sync) => !targetIds.has(sync.connection.id))
        .map(async (sync) => {
          await this.deleteGoogleEvent(sync.connection, sync.googleEventId);
          await syncRepo.remove(sync);
        })
    );

    targetConnections = targetConnections.filter((connection) => !existingSyncs.some((sync) => sync.connection.id === connection.id && !targetIds.has(sync.connection.id)));
    await Promise.all(
      targetConnections.map(async (connection) => {
        const sync = existingSyncs.find((item) => item.connection.id === connection.id);
        try {
          const googleEventId = sync
            ? await this.updateGoogleEvent(connection, sync.googleEventId, event)
            : await this.createGoogleEvent(connection, event);
          await syncRepo.save(
            syncRepo.create({
              id: sync?.id,
              agendaEvent: event,
              connection,
              googleEventId,
              status: "synced",
              lastError: undefined
            })
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro desconhecido";
          await syncRepo.save(
            syncRepo.create({
              id: sync?.id,
              agendaEvent: event,
              connection,
              googleEventId: sync?.googleEventId ?? "pending",
              status: "failed",
              lastError: message.slice(0, 2000)
            })
          );
        }
      })
    );
  }

  async deleteEventSyncs(eventId: string) {
    if (!env.google.calendarEnabled) return;
    const syncRepo = repositories.googleCalendarEventSyncs();
    const syncs = await syncRepo.find({
      where: { agendaEvent: { id: eventId } },
      relations: { connection: true }
    });
    await Promise.all(syncs.map((sync) => this.deleteGoogleEvent(sync.connection, sync.googleEventId)));
    await syncRepo.remove(syncs);
  }

  private async targetConnections(user: User, responsible: string) {
    const connections = await repositories.googleCalendarConnections().find({ where: { user: { id: user.id } } });
    if (normalizeResponsible(responsible) === "casa") return connections;
    return connections.filter((connection) => normalizeResponsible(connection.responsible) === normalizeResponsible(responsible));
  }

  private eventsForConnection(events: AgendaEvent[], responsible: string) {
    if (normalizeResponsible(responsible) === "casa") return events;
    return events.filter((event) => {
      const eventResponsible = normalizeResponsible(event.responsible);
      return eventResponsible === "casa" || eventResponsible === normalizeResponsible(responsible);
    });
  }

  private async syncExistingEventsForConnection(user: User, connection: GoogleCalendarConnection) {
    const events = await repositories.agenda().find({ where: { user: { id: user.id } } });
    await Promise.all(this.eventsForConnection(events, connection.responsible).map((event) => this.syncEvent(user, event)));
  }

  private calendarClient(connection: GoogleCalendarConnection) {
    const oauthClient = this.oauthClient();
    oauthClient.setCredentials({
      access_token: decrypt(connection.accessToken),
      refresh_token: decrypt(connection.refreshToken),
      expiry_date: connection.tokenExpiryDate?.getTime()
    });
    return google.calendar({ version: "v3", auth: oauthClient });
  }

  private googleEventBody(event: AgendaEvent) {
    const endTime = event.endTime || addMinutes(event.startTime, 60);
    return {
      summary: event.title,
      location: event.location || undefined,
      description: event.notes || undefined,
      start: { dateTime: asDateTime(event.date, event.startTime), timeZone: env.timezone },
      end: { dateTime: asDateTime(event.date, endTime), timeZone: env.timezone }
    };
  }

  private async createGoogleEvent(connection: GoogleCalendarConnection, event: AgendaEvent) {
    const calendar = this.calendarClient(connection);
    const response = await calendar.events.insert({
      calendarId: connection.calendarId,
      requestBody: this.googleEventBody(event)
    });
    if (!response.data.id) throw new Error("Google não retornou o ID do evento");
    return response.data.id;
  }

  private async updateGoogleEvent(connection: GoogleCalendarConnection, googleEventId: string, event: AgendaEvent) {
    if (googleEventId === "pending") return this.createGoogleEvent(connection, event);
    const calendar = this.calendarClient(connection);
    const response = await calendar.events.update({
      calendarId: connection.calendarId,
      eventId: googleEventId,
      requestBody: this.googleEventBody(event)
    });
    return response.data.id ?? googleEventId;
  }

  private async deleteGoogleEvent(connection: GoogleCalendarConnection, googleEventId: string) {
    if (googleEventId === "pending") return;
    try {
      await this.calendarClient(connection).events.delete({
        calendarId: connection.calendarId,
        eventId: googleEventId
      });
    } catch {
      return;
    }
  }
}

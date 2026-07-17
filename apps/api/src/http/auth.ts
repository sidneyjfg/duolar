import { User } from "../entities/User";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";
import { CSRF_COOKIE, SESSION_COOKIE, parseCookies } from "./cookies";
import crypto from "crypto";

export type AuthHeaders = Record<string, string | undefined | null>;

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requireUser(headers: AuthHeaders): Promise<User> {
  const cookies = parseCookies(headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) throw new AppError("Sessão inválida", 401);

  const session = await repositories.sessions().findOne({
    where: { tokenHash: hashToken(sessionToken) },
    relations: { user: true }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new AppError("Sessão inválida", 401);

  const user = session.user;
  if (!user || user.disabledAt) throw new AppError("Sessão inválida", 401);
  return user;
}

export function requireCsrf(headers: AuthHeaders) {
  const cookies = parseCookies(headers.cookie);
  const csrfCookie = cookies[CSRF_COOKIE];
  const csrfHeader = headers["x-csrf-token"];
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throw new AppError("Requisição inválida", 403);
  }
}

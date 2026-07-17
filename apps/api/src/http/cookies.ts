import { env } from "../config/env";

export const SESSION_COOKIE = "duolar_session";
export const CSRF_COOKIE = "duolar_csrf";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export function parseCookies(cookieHeader?: string | null) {
  return Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator === -1) return [part, ""];
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

function cookieBase(path: string, httpOnly: boolean) {
  const parts = [`Path=${path}`, "SameSite=Lax", `Max-Age=${sessionMaxAgeSeconds}`];
  if (httpOnly) parts.push("HttpOnly");
  if (env.isProduction) parts.push("Secure");
  return parts.join("; ");
}

export function sessionCookies(sessionToken: string, csrfToken: string) {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; ${cookieBase("/api", true)}`,
    `${CSRF_COOKIE}=${encodeURIComponent(csrfToken)}; ${cookieBase("/", false)}`
  ];
}

export function clearSessionCookies() {
  const secure = env.isProduction ? "; Secure" : "";
  return [
    `${SESSION_COOKIE}=; Path=/api; SameSite=Lax; HttpOnly; Max-Age=0${secure}`,
    `${CSRF_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0${secure}`
  ];
}

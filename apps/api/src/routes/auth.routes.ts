import { Elysia } from "elysia";
import { env } from "../config/env";
import { LoginDto, RegisterDto, UpdateProfileDto } from "../dtos/AuthDto";
import { AuthService } from "../services/AuthService";
import { requireUser } from "../http/auth";
import { SESSION_COOKIE, parseCookies, clearSessionCookies, sessionCookies } from "../http/cookies";
import { rateLimit, rateLimitKey } from "../http/rate-limit";
import { applySecurityHeaders } from "../http/security";
import { logSecurityEvent } from "../http/security-log";
import { validateDto } from "../utils/validate";

const service = new AuthService();
const authWindowMs = 15 * 60 * 1000;

function jsonWithCookies(body: unknown, cookies: string[], status = 200) {
  const headers: Record<string, string | number> = {
    "Content-Type": "application/json;charset=utf-8",
    "Access-Control-Allow-Origin": env.webOrigin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin"
  };
  applySecurityHeaders(headers);

  const headerPairs = Object.entries(headers).map(([name, value]) => [name, String(value)] as [string, string]);
  for (const cookie of cookies) {
    headerPairs.push(["Set-Cookie", cookie]);
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: headerPairs
  });
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post("/register", async ({ body, headers }) => {
    const data = await validateDto(RegisterDto, body);
    rateLimit(rateLimitKey(headers, "register", data.email), 5, authWindowMs);
    try {
      const result = await service.register(data);
      logSecurityEvent({ event: "register", outcome: "success", email: data.email, subjectId: result.user.id });
      return jsonWithCookies({ user: result.user, csrfToken: result.csrfToken }, sessionCookies(result.sessionToken, result.csrfToken), 201);
    } catch (error) {
      logSecurityEvent({ event: "register", outcome: "failure", email: data.email, reason: "rejected" });
      throw error;
    }
  })
  .post("/login", async ({ body, headers }) => {
    const data = await validateDto(LoginDto, body);
    rateLimit(rateLimitKey(headers, "login", data.email), 8, authWindowMs);
    try {
      const result = await service.login(data);
      logSecurityEvent({ event: "login", outcome: "success", email: data.email, subjectId: result.user.id });
      return jsonWithCookies({ user: result.user, csrfToken: result.csrfToken }, sessionCookies(result.sessionToken, result.csrfToken));
    } catch (error) {
      logSecurityEvent({ event: "login", outcome: "failure", email: data.email, reason: "rejected" });
      throw error;
    }
  })
  .post("/logout", async ({ headers }) => {
    const sessionToken = parseCookies(headers.cookie)[SESSION_COOKIE];
    const result = await service.logout(sessionToken);
    return jsonWithCookies(result, clearSessionCookies());
  })
  .get("/me", async ({ headers }) => {
    const user = await requireUser(headers);
    const { password: _password, ...safeUser } = user;
    return { ...safeUser, responsibleNames: safeUser.responsibleNames?.length ? safeUser.responsibleNames : [safeUser.name] };
  })
  .patch("/me", async ({ body, headers }) => {
    const user = await requireUser(headers);
    const data = await validateDto(UpdateProfileDto, body);
    return service.updateProfile(user, data);
  });

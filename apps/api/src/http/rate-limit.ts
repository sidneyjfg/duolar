import { AppError } from "../errors/AppError";
import { hashIdentifier, logSecurityEvent } from "./security-log";

type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    logSecurityEvent({ event: "rate_limit", outcome: "blocked", subjectId: hashIdentifier(key), reason: "limit_exceeded" });
    throw new AppError("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);
  }
}

export function rateLimitKey(headers: Record<string, string | undefined>, purpose: string, email?: string) {
  const forwardedFor = headers["x-forwarded-for"]?.split(",")[0]?.trim();
  const ip = forwardedFor || headers["x-real-ip"] || "local";
  return `${purpose}:${ip}:${email?.trim().toLowerCase() ?? "unknown"}`;
}

import crypto from "crypto";

type SecurityEvent = {
  event: string;
  outcome: "success" | "failure" | "blocked";
  email?: string;
  subjectId?: string;
  reason?: string;
};

export function hashIdentifier(value?: string) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export function logSecurityEvent(event: SecurityEvent) {
  const payload = {
    ts: new Date().toISOString(),
    event: event.event,
    outcome: event.outcome,
    emailHash: hashIdentifier(event.email),
    subjectId: event.subjectId,
    reason: event.reason
  };
  console.info(JSON.stringify(payload));
}

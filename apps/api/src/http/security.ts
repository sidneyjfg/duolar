import { env } from "../config/env";

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy-Report-Only": "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
} as const;

export function applySecurityHeaders(headers: Record<string, string | number>) {
  Object.assign(headers, securityHeaders);
  if (env.isProduction) {
    headers["Strict-Transport-Security"] = "max-age=15552000; includeSubDomains";
  }
}

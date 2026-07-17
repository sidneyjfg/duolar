import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const isProduction = process.env.NODE_ENV === "production";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required in production`);
  return value;
}

function optionalEnv(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

function booleanEnv(name: string, fallback = false) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value);
}

function jwtSecret() {
  const value = isProduction ? requiredEnv("JWT_SECRET") : optionalEnv("JWT_SECRET", "dev-secret");
  if (isProduction && value.length < 32) {
    throw new Error("JWT_SECRET must have at least 32 characters in production");
  }
  return value;
}

function webOrigin() {
  const value = isProduction ? requiredEnv("WEB_ORIGIN") : optionalEnv("WEB_ORIGIN", "http://localhost:3000");
  if (isProduction && !value.startsWith("https://")) {
    throw new Error("WEB_ORIGIN must use HTTPS in production");
  }
  return value;
}

function googleTokenEncryptionKey(calendarEnabled: boolean) {
  const value = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
  if (calendarEnabled && isProduction && (!value || value.length < 32)) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must have at least 32 characters when Google Calendar is enabled in production");
  }
  return value;
}

const googleCalendarEnabled = booleanEnv("GOOGLE_CALENDAR_ENABLED", false);

export const env = {
  isProduction,
  port: Number(process.env.PORT ?? 4000),
  database: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3308),
    username: process.env.DB_USERNAME ?? "duolar",
    password: process.env.DB_PASSWORD ?? "duolar",
    database: process.env.DB_DATABASE ?? "duolar"
  },
  jwtSecret: jwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  webOrigin: webOrigin(),
  timezone: process.env.APP_TIMEZONE ?? "America/Sao_Paulo",
  google: {
    calendarEnabled: googleCalendarEnabled,
    tokenEncryptionKey: googleTokenEncryptionKey(googleCalendarEnabled),
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/api/integrations/google-calendar/callback"
  }
};

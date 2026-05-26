import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  database: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3308),
    username: process.env.DB_USERNAME ?? "duolar",
    password: process.env.DB_PASSWORD ?? "duolar",
    database: process.env.DB_DATABASE ?? "duolar"
  },
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  timezone: process.env.APP_TIMEZONE ?? "America/Sao_Paulo",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/api/integrations/google-calendar/callback"
  }
};

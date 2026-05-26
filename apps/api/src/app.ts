import "express-async-errors";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { routes } from "./routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.webOrigin, credentials: true }));
app.use(express.json());
app.use("/api", routes);
app.use(errorHandler);

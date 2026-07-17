import { AppError } from "../errors/AppError";

type ErrorSet = {
  status?: number | string;
};

export function formatHttpError(error: unknown, set: ErrorSet) {
  if (error instanceof AppError) {
    set.status = error.statusCode;
    return { message: error.message, details: process.env.NODE_ENV === "production" ? undefined : error.details };
  }

  set.status = 500;
  const details = process.env.NODE_ENV === "production" ? undefined : error instanceof Error ? error.message : String(error);
  return { message: "Erro interno", details };
}

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AppError } from "../errors/AppError";

export async function validateDto<T extends object>(Dto: new () => T, payload: unknown): Promise<T> {
  const instance = plainToInstance(Dto, payload);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });

  if (errors.length > 0) {
    throw new AppError("Dados inválidos", 422, errors.map((error) => error.constraints));
  }

  return instance;
}

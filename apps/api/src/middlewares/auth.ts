import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";
import { verifyToken } from "../utils/jwt";

export async function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError("Token ausente", 401);

  const token = header.replace("Bearer ", "");
  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError("Token inválido", 401);
  }
  const user = await repositories.users().findOneBy({ id: payload.sub });
  if (!user) throw new AppError("Usuário não encontrado", 401);
  req.user = user;
  next();
}

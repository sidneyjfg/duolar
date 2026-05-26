import bcrypt from "bcryptjs";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";
import { signToken } from "../utils/jwt";
import { LoginDto, RegisterDto, UpdateProfileDto } from "../dtos/AuthDto";
import { User } from "../entities/User";

function normalizeResponsibleNames(names: string[]) {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}

function sanitizeUser(user: { id: string; name: string; email: string; createdAt: Date; responsibleNames?: string[] }) {
  const responsibleNames = user.responsibleNames?.length ? user.responsibleNames : [user.name];
  return { id: user.id, name: user.name, email: user.email, responsibleNames, createdAt: user.createdAt };
}

export class AuthService {
  async register(data: RegisterDto) {
    const users = repositories.users();
    const exists = await users.findOneBy({ email: data.email.toLowerCase() });
    if (exists) throw new AppError("E-mail já cadastrado", 409);

    const user = users.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: await bcrypt.hash(data.password, 12),
      responsibleNames: [data.name]
    });

    await users.save(user);
    return { user: sanitizeUser(user), token: signToken(user.id) };
  }

  async login(data: LoginDto) {
    const user = await repositories.users().findOneBy({ email: data.email.toLowerCase() });
    if (!user) throw new AppError("Credenciais inválidas", 401);

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError("Credenciais inválidas", 401);

    return { user: sanitizeUser(user), token: signToken(user.id) };
  }

  async updateProfile(user: User, data: UpdateProfileDto) {
    if (data.responsibleNames) {
      const responsibleNames = normalizeResponsibleNames(data.responsibleNames);
      if (!responsibleNames.length) throw new AppError("Informe pelo menos um responsável", 400);
      user.responsibleNames = responsibleNames;
    }
    await repositories.users().save(user);
    return sanitizeUser(user);
  }
}

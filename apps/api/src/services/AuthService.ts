import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppError } from "../errors/AppError";
import { repositories } from "../repositories";
import { LoginDto, RegisterDto, UpdateProfileDto } from "../dtos/AuthDto";
import { User } from "../entities/User";
import { hashToken } from "../http/auth";

function normalizeResponsibleNames(names: string[]) {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}

function sanitizeUser(user: { id: string; name: string; email: string; createdAt: Date; responsibleNames?: string[] }) {
  const responsibleNames = user.responsibleNames?.length ? user.responsibleNames : [user.name];
  return { id: user.id, name: user.name, email: user.email, responsibleNames, createdAt: user.createdAt };
}

export class AuthService {
  private async createSession(user: User) {
    const sessionToken = crypto.randomBytes(32).toString("base64url");
    const csrfToken = crypto.randomBytes(32).toString("base64url");
    await repositories.sessions().save(
      repositories.sessions().create({
        user,
        tokenHash: hashToken(sessionToken),
        csrfTokenHash: hashToken(csrfToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
    );
    return { sessionToken, csrfToken };
  }

  async register(data: RegisterDto) {
    const users = repositories.users();
    const email = data.email.toLowerCase();
    const exists = await users.findOneBy({ email: data.email.toLowerCase() });
    if (exists) throw new AppError("Não foi possível concluir a autenticação", 401);

    const invite = await repositories.invites().findOneBy({ tokenHash: hashToken(data.inviteToken) });
    if (!invite || invite.revokedAt || invite.usedAt || invite.email.toLowerCase() !== email || (invite.expiresAt && invite.expiresAt <= new Date())) {
      throw new AppError("Não foi possível concluir a autenticação", 401);
    }

    const user = users.create({
      name: data.name,
      email,
      password: await bcrypt.hash(data.password, 12),
      responsibleNames: [data.name]
    });

    await users.save(user);
    invite.usedAt = new Date();
    invite.usedBy = user;
    await repositories.invites().save(invite);
    return { user: sanitizeUser(user), ...(await this.createSession(user)) };
  }

  async login(data: LoginDto) {
    const user = await repositories.users().findOneBy({ email: data.email.toLowerCase() });
    if (!user || user.disabledAt) throw new AppError("Não foi possível concluir a autenticação", 401);

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AppError("Não foi possível concluir a autenticação", 401);

    return { user: sanitizeUser(user), ...(await this.createSession(user)) };
  }

  async logout(sessionToken?: string) {
    if (!sessionToken) return { ok: true };
    const session = await repositories.sessions().findOneBy({ tokenHash: hashToken(sessionToken) });
    if (session && !session.revokedAt) {
      session.revokedAt = new Date();
      await repositories.sessions().save(session);
    }
    return { ok: true };
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

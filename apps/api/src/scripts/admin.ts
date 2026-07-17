import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppDataSource } from "../config/data-source";
import { Invite } from "../entities/Invite";
import { hashToken } from "../http/auth";
import { logSecurityEvent } from "../http/security-log";
import { repositories } from "../repositories";

function usage() {
  console.log(`Uso:
  npm run admin -- create-invite email@example.com
  npm run admin -- revoke-invite <invite-id-or-token>
  npm run admin -- disable-user email@example.com
  npm run admin -- enable-user email@example.com
  npm run admin -- reset-password email@example.com "nova-senha"
  npm run admin -- export-user email@example.com
  npm run admin -- delete-user email@example.com`);
}

function inviteToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function findUserByEmail(email: string) {
  return repositories.users().findOneBy({ email: email.toLowerCase() });
}

async function findInvite(value: string) {
  const repo = repositories.invites();
  return (
    (await repo.findOneBy({ id: value })) ??
    (await repo.findOneBy({ tokenHash: hashToken(value) }))
  );
}

async function exportUser(email: string) {
  const user = await repositories.users().findOne({
    where: { email: email.toLowerCase() },
    relations: {
      tasks: true,
      shoppingItems: true,
      purchaseSessions: true,
      finances: true,
      agendaEvents: true,
      personalRules: true,
      googleCalendarConnections: true
    }
  });
  if (!user) throw new Error("Usuario nao encontrado");
  const { password: _password, sessions: _sessions, ...safeUser } = user;
  console.log(JSON.stringify(safeUser, null, 2));
}

async function main() {
  const [command, arg1, arg2] = process.argv.slice(2);
  if (!command) {
    usage();
    return;
  }

  await AppDataSource.initialize();

  try {
    if (command === "create-invite") {
      if (!arg1) throw new Error("Informe o e-mail");
      const email = arg1.toLowerCase();
      const token = inviteToken();
      const invite = repositories.invites().create({ email, tokenHash: hashToken(token) } satisfies Partial<Invite>);
      await repositories.invites().save(invite);
      logSecurityEvent({ event: "admin_create_invite", outcome: "success", email, subjectId: invite.id });
      console.log(JSON.stringify({ id: invite.id, email, token }, null, 2));
      return;
    }

    if (command === "revoke-invite") {
      if (!arg1) throw new Error("Informe o id ou token do convite");
      const invite = await findInvite(arg1);
      if (!invite) throw new Error("Convite nao encontrado");
      invite.revokedAt = new Date();
      await repositories.invites().save(invite);
      logSecurityEvent({ event: "admin_revoke_invite", outcome: "success", email: invite.email, subjectId: invite.id });
      console.log(JSON.stringify({ ok: true, id: invite.id }, null, 2));
      return;
    }

    if (command === "disable-user" || command === "enable-user") {
      if (!arg1) throw new Error("Informe o e-mail");
      const user = await findUserByEmail(arg1);
      if (!user) throw new Error("Usuario nao encontrado");
      user.disabledAt = command === "disable-user" ? new Date() : null;
      await repositories.users().save(user);
      if (command === "disable-user") {
        await repositories.sessions().update({ user: { id: user.id } }, { revokedAt: new Date() });
      }
      logSecurityEvent({ event: `admin_${command.replace("-", "_")}`, outcome: "success", email: user.email, subjectId: user.id });
      console.log(JSON.stringify({ ok: true, email: user.email, disabled: Boolean(user.disabledAt) }, null, 2));
      return;
    }

    if (command === "reset-password") {
      if (!arg1 || !arg2) throw new Error("Informe e-mail e nova senha");
      if (arg2.length < 8) throw new Error("Senha deve ter pelo menos 8 caracteres");
      const user = await findUserByEmail(arg1);
      if (!user) throw new Error("Usuario nao encontrado");
      user.password = await bcrypt.hash(arg2, 12);
      await repositories.users().save(user);
      await repositories.sessions().update({ user: { id: user.id } }, { revokedAt: new Date() });
      logSecurityEvent({ event: "admin_reset_password", outcome: "success", email: user.email, subjectId: user.id });
      console.log(JSON.stringify({ ok: true, email: user.email }, null, 2));
      return;
    }

    if (command === "export-user") {
      if (!arg1) throw new Error("Informe o e-mail");
      logSecurityEvent({ event: "admin_export_user", outcome: "success", email: arg1 });
      await exportUser(arg1);
      return;
    }

    if (command === "delete-user") {
      if (!arg1) throw new Error("Informe o e-mail");
      const user = await findUserByEmail(arg1);
      if (!user) throw new Error("Usuario nao encontrado");
      await repositories.users().remove(user);
      logSecurityEvent({ event: "admin_delete_user", outcome: "success", email: arg1, subjectId: user.id });
      console.log(JSON.stringify({ ok: true, email: arg1.toLowerCase() }, null, 2));
      return;
    }

    usage();
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});

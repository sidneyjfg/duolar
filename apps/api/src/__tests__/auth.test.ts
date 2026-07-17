import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { AppError } from "../errors/AppError";
import { requireCsrf, requireUser, hashToken } from "../http/auth";
import { CSRF_COOKIE, SESSION_COOKIE, clearSessionCookies, parseCookies, sessionCookies } from "../http/cookies";
import { rateLimit } from "../http/rate-limit";
import { repositories } from "../repositories";
import { AuthService } from "../services/AuthService";
import { LoginDto, RegisterDto } from "../dtos/AuthDto";
import { validateDto } from "../utils/validate";

type FakeUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  responsibleNames?: string[];
  createdAt: Date;
  disabledAt?: Date | null;
};

const originalRepositories = { ...repositories };
const tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
const afterEachCallbacks: Array<() => void> = [];

function test(name: string, fn: () => Promise<void> | void) {
  tests.push({ name, fn });
}

function afterEach(callback: () => void) {
  afterEachCallbacks.push(callback);
}

afterEach(() => {
  Object.assign(repositories, originalRepositories);
});

function appError(error: unknown) {
  assert.ok(error instanceof AppError);
  return error;
}

function mockAuthRepos(options: {
  users?: FakeUser[];
  invites?: Array<Record<string, any>>;
  sessions?: Array<Record<string, any>>;
}) {
  const users = options.users ?? [];
  const invites = options.invites ?? [];
  const sessions = options.sessions ?? [];

  repositories.users = () =>
    ({
      findOneBy: async (where: Partial<FakeUser>) => users.find((user) => Object.entries(where).every(([key, value]) => (user as any)[key] === value)) ?? null,
      create: (data: Partial<FakeUser>) => ({ id: `user-${users.length + 1}`, createdAt: new Date("2026-01-01T00:00:00.000Z"), ...data }),
      save: async (user: FakeUser) => {
        if (!users.includes(user)) users.push(user);
        return user;
      }
    }) as any;

  repositories.invites = () =>
    ({
      findOneBy: async (where: Record<string, unknown>) => invites.find((invite) => Object.entries(where).every(([key, value]) => invite[key] === value)) ?? null,
      save: async (invite: Record<string, unknown>) => invite
    }) as any;

  repositories.sessions = () =>
    ({
      findOne: async ({ where }: { where: Record<string, unknown> }) => sessions.find((session) => session.tokenHash === where.tokenHash) ?? null,
      findOneBy: async (where: Record<string, unknown>) => sessions.find((session) => Object.entries(where).every(([key, value]) => session[key] === value)) ?? null,
      create: (data: Record<string, unknown>) => ({ id: `session-${sessions.length + 1}`, ...data }),
      save: async (session: Record<string, unknown>) => {
        if (!sessions.includes(session)) sessions.push(session);
        return session;
      }
    }) as any;

  return { users, invites, sessions };
}

test("login valido cria sessao sem expor token persistivel", async () => {
  const password = await bcrypt.hash("senha-segura", 12);
  const user: FakeUser = {
    id: "user-1",
    name: "Sidney",
    email: "sidney@example.com",
    password,
    responsibleNames: ["Sidney"],
    createdAt: new Date("2026-01-01T00:00:00.000Z")
  };
  const { sessions } = mockAuthRepos({ users: [user] });

  const result = await new AuthService().login({ email: "SIDNEY@example.com", password: "senha-segura" });

  assert.equal(result.user.email, "sidney@example.com");
  assert.equal("token" in result, false);
  assert.equal(result.sessionToken.length > 20, true);
  assert.equal(result.csrfToken.length > 20, true);
  assert.equal(sessions.length, 1);
  assert.match(sessions[0].tokenHash, /^[a-f0-9]{64}$/);
  assert.match(sessions[0].csrfTokenHash, /^[a-f0-9]{64}$/);
});

test("login invalido ou usuario desativado retorna erro generico", async () => {
  const password = await bcrypt.hash("senha-segura", 12);
  mockAuthRepos({
    users: [
      {
        id: "user-1",
        name: "Sidney",
        email: "sidney@example.com",
        password,
        createdAt: new Date(),
        disabledAt: new Date()
      }
    ]
  });

  await assert.rejects(
    () => new AuthService().login({ email: "sidney@example.com", password: "senha-segura" }),
    (error) => {
      const app = appError(error);
      assert.equal(app.statusCode, 401);
      assert.equal(app.message, "Não foi possível concluir a autenticação");
      return true;
    }
  );
});

test("cadastro consome convite valido de uso unico", async () => {
  const inviteToken = "convite-super-seguro-123456";
  const invite: Record<string, any> = {
    id: "invite-1",
    email: "novo@example.com",
    tokenHash: hashToken(inviteToken),
    usedAt: null,
    revokedAt: null,
    expiresAt: null
  };
  const { users, sessions } = mockAuthRepos({ invites: [invite] });

  const result = await new AuthService().register({
    name: "Novo",
    email: "novo@example.com",
    password: "senha-segura",
    inviteToken
  });

  assert.equal(result.user.email, "novo@example.com");
  assert.equal(users.length, 1);
  assert.equal(sessions.length, 1);
  assert.ok(invite.usedAt instanceof Date);
  assert.equal((invite as any).usedBy.id, result.user.id);
});

test("cadastro rejeita convite reutilizado, revogado ou de outro email", async () => {
  const inviteToken = "convite-super-seguro-123456";
  mockAuthRepos({
    invites: [
      {
        id: "invite-1",
        email: "outro@example.com",
        tokenHash: hashToken(inviteToken),
        usedAt: null,
        revokedAt: null,
        expiresAt: null
      }
    ]
  });

  await assert.rejects(
    () =>
      new AuthService().register({
        name: "Novo",
        email: "novo@example.com",
        password: "senha-segura",
        inviteToken
      }),
    (error) => {
      const app = appError(error);
      assert.equal(app.statusCode, 401);
      assert.equal(app.message, "Não foi possível concluir a autenticação");
      return true;
    }
  );
});

test("logout revoga a sessao existente", async () => {
  const sessionToken = "sessao-segura";
  const session: Record<string, any> = { id: "session-1", tokenHash: hashToken(sessionToken), revokedAt: null };
  mockAuthRepos({ sessions: [session] });

  await new AuthService().logout(sessionToken);

  assert.ok(session.revokedAt instanceof Date);
});

test("requireUser aceita sessao valida e rejeita sessao revogada", async () => {
  const sessionToken = "sessao-segura";
  const user = { id: "user-1", disabledAt: null };
  mockAuthRepos({
    sessions: [
      {
        id: "session-1",
        tokenHash: hashToken(sessionToken),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user
      }
    ]
  });

  const authenticated = await requireUser({ cookie: `${SESSION_COOKIE}=${sessionToken}` });
  assert.equal(authenticated.id, "user-1");

  await assert.rejects(() => requireUser({ cookie: `${SESSION_COOKIE}=outra` }), (error) => {
    const app = appError(error);
    assert.equal(app.statusCode, 401);
    return true;
  });
});

test("CSRF exige cookie e header iguais", () => {
  assert.doesNotThrow(() => requireCsrf({ cookie: `${CSRF_COOKIE}=abc`, "x-csrf-token": "abc" }));
  assert.throws(
    () => requireCsrf({ cookie: `${CSRF_COOKIE}=abc`, "x-csrf-token": "def" }),
    (error) => {
      const app = appError(error);
      assert.equal(app.statusCode, 403);
      return true;
    }
  );
});

test("cookies de sessao e limpeza usam flags esperadas", () => {
  const cookies = sessionCookies("sessao", "csrf");
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], new RegExp(`${SESSION_COOKIE}=sessao`));
  assert.match(cookies[0], /HttpOnly/);
  assert.match(cookies[0], /SameSite=Lax/);
  assert.match(cookies[1], new RegExp(`${CSRF_COOKIE}=csrf`));
  assert.doesNotMatch(cookies[1], /HttpOnly/);

  const parsed = parseCookies(`${SESSION_COOKIE}=sessao; ${CSRF_COOKIE}=csrf`);
  assert.equal(parsed[SESSION_COOKIE], "sessao");
  assert.equal(parsed[CSRF_COOKIE], "csrf");
  assert.match(clearSessionCookies()[0], /Max-Age=0/);
});

test("rate limit bloqueia excesso de tentativas", () => {
  const key = `test:${Date.now()}:${Math.random()}`;
  rateLimit(key, 2, 60_000);
  rateLimit(key, 2, 60_000);
  assert.throws(
    () => rateLimit(key, 2, 60_000),
    (error) => {
      const app = appError(error);
      assert.equal(app.statusCode, 429);
      return true;
    }
  );
});

test("DTOs rejeitam campos extras e limites inseguros", async () => {
  await assert.rejects(
    () => validateDto(LoginDto, { email: "sidney@example.com", password: "senha-segura", role: "admin" }),
    (error) => {
      const app = appError(error);
      assert.equal(app.statusCode, 422);
      return true;
    }
  );

  await assert.rejects(
    () =>
      validateDto(RegisterDto, {
        name: "A".repeat(81),
        email: "sidney@example.com",
        password: "senha-segura",
        inviteToken: "convite-super-seguro-123456"
      }),
    (error) => {
      const app = appError(error);
      assert.equal(app.statusCode, 422);
      return true;
    }
  );
});

async function run() {
  let failed = 0;
  for (const item of tests) {
    try {
      await item.fn();
      console.log(`ok - ${item.name}`);
    } catch (error) {
      failed += 1;
      console.error(`not ok - ${item.name}`);
      console.error(error);
    } finally {
      for (const callback of afterEachCallbacks) callback();
    }
  }

  console.log(`${tests.length - failed}/${tests.length} testes passaram`);
  if (failed > 0) process.exit(1);
}

void run();

# Deploy

## API containerizavel

A API roda em Bun/Elysia e o container nao cria instancia de banco. Ele apenas conecta em um MySQL existente usando variaveis de ambiente.

Variaveis obrigatorias para a API:

```text
DB_HOST=<host-do-mysql>
DB_PORT=3306
DB_USERNAME=<usuario>
DB_PASSWORD=<senha>
DB_DATABASE=<database>
JWT_SECRET=<gere-um-segredo-forte>
JWT_EXPIRES_IN=7d
PORT=4000
WEB_ORIGIN=https://<origem-do-front>
APP_TIMEZONE=America/Sao_Paulo
GOOGLE_CALENDAR_ENABLED=false
GOOGLE_TOKEN_ENCRYPTION_KEY=<gere-outro-segredo-forte-se-reativar-google>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://<sua-api>/api/integrations/google-calendar/callback
```

Build do container, usando a raiz do repositorio como contexto:

```bash
docker build -f apps/api/Dockerfile -t duolar-api .
```

Subida com Compose:

```bash
docker compose up -d api
```

Quando a API roda em container, `localhost` aponta para o proprio container. O `docker-compose.yml` sobrescreve `DB_HOST` para `host.docker.internal`, mantendo as demais credenciais do `apps/api/.env`.

Se o MySQL estiver em outro host/container, ajuste `DB_HOST` no `docker-compose.yml` ou publique esse host na rede do container.

Migrations sao manuais e devem ser executadas somente quando voce decidir:

```bash
cd apps/api
bun run migration:run
```

Ou pelo container:

```bash
docker-compose run --rm api bun run migration:run
```

## Front no GitHub Pages

No repositorio do GitHub:

1. Abra Settings > Pages.
2. Em Build and deployment, selecione GitHub Actions.
3. Em Settings > Secrets and variables > Actions > Variables, crie `NEXT_PUBLIC_API_URL` apontando para a API publicada, incluindo `/api`.

O workflow `.github/workflows/deploy-web-pages.yml` publica `apps/web/out` no GitHub Pages a cada push na `master`.

## Publicacao local com tunnel HTTPS

Para a primeira publicacao, exponha apenas uma URL HTTPS de tunnel apontando para um proxy local unico. O proxy deve servir:

- `/` para o frontend estatico;
- `/api` para a API local em `http://127.0.0.1:4000`.

Nao exponha MySQL publicamente. Nao exponha a API em `0.0.0.0` para a rede externa; o `docker-compose.yml` publica `127.0.0.1:4000:4000`.

Headers recomendados no proxy:

```text
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy-Report-Only: default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Rate limit recomendado no proxy/tunnel, como camada adicional ao limite em memoria do backend:

- login/cadastro: limite baixo por IP;
- `/api/*`: limite moderado por IP;
- negar requests com `Origin` inesperado para metodos `POST`, `PATCH` e `DELETE`.

O backend continua sendo a fonte de autorizacao. O frontend estatico nunca deve carregar segredos.

## Seguranca operacional

Antes de publicar:

```bash
npm run migration:run
npm run typecheck
npm run lint
npm run build
npm audit --workspaces --audit-level=high
docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep --config p/security-audit --config p/owasp-top-ten /src
docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep --config p/secrets /src
```

O sistema esta em teste e sem backup nesta fase.

## Evolucao futura

As evolucoes de multiusuario real, admin UI, reset publico de senha, backup criptografado e reativacao do Google Calendar estao documentadas em `docs/security-roadmap.md`.

Nao implemente essas funcionalidades junto da primeira publicacao controlada. Elas mudam o modelo de autorizacao e devem entrar somente depois de testes especificos.

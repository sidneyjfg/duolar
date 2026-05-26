# Deploy

## API na Railway

1. Suba este projeto para um repositorio no GitHub.
2. Na Railway, crie um projeto e conecte o repositorio.
3. Crie um servico para a API usando a raiz do repositorio. O `railway.json` ja limita build/start para `apps/api`.
4. Adicione um MySQL no mesmo projeto da Railway.
5. Configure as variaveis da API:

```text
DB_HOST=${{ MySQL.MYSQLHOST }}
DB_PORT=${{ MySQL.MYSQLPORT }}
DB_USERNAME=${{ MySQL.MYSQLUSER }}
DB_PASSWORD=${{ MySQL.MYSQLPASSWORD }}
DB_DATABASE=${{ MySQL.MYSQLDATABASE }}
JWT_SECRET=<gere-um-segredo-forte>
JWT_EXPIRES_IN=7d
WEB_ORIGIN=https://<usuario>.github.io/<repositorio>
APP_TIMEZONE=America/Sao_Paulo
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://<sua-api>.up.railway.app/api/integrations/google-calendar/callback
```

Depois gere um dominio publico na Railway para a API. A URL final usada pelo front deve ficar assim:

```text
https://<sua-api>.up.railway.app/api
```

## Front no GitHub Pages

No repositorio do GitHub:

1. Abra Settings > Pages.
2. Em Build and deployment, selecione GitHub Actions.
3. Em Settings > Secrets and variables > Actions > Variables, crie:

```text
NEXT_PUBLIC_API_URL=https://<sua-api>.up.railway.app/api
```

O workflow `.github/workflows/deploy-web-pages.yml` publica `apps/web/out` no GitHub Pages a cada push na `main`.

## Deploy da API via GitHub Actions

A Railway ja pode fazer autodeploy direto do GitHub. Se preferir usar o workflow `.github/workflows/deploy-api-railway.yml`, configure:

```text
Secret: RAILWAY_TOKEN
Variable: RAILWAY_SERVICE=<nome-do-servico-da-api-na-railway>
Variable: RAILWAY_ENVIRONMENT=production
```

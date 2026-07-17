# Como subir e divulgar pros amigos

Este guia e para publicar o DuoLar localmente na sua maquina, com uma URL HTTPS gratuita de tunnel, cadastro fechado por convite e administracao por scripts locais.

Estado atual do sistema:

- em teste;
- sem backup;
- Google Calendar desligado por seguranca;
- um link publico unico para frontend e API;
- MySQL local, nao exposto.

## 1. Gerar o segredo forte

Antes de subir em modo producao, gere um `JWT_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Exemplo de saida:

```text
K0O3b5JxgK1EVV1GRO7dHy4HHUd7HGfRjB_9kTf9yXg
```

Copie esse valor. Ele sera usado no `apps/api/.env`.

## 2. Preparar variaveis iniciais

Crie/ajuste `apps/api/.env` com base no `.env.example`.

Preencha tudo, mas deixe `WEB_ORIGIN` temporariamente com um valor HTTPS fake ate o ngrok gerar a URL real:

```text
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USERNAME=duolar
DB_PASSWORD=<sua-senha-local>
DB_DATABASE=duolar
JWT_SECRET=<cole-aqui-o-segredo-gerado>
JWT_EXPIRES_IN=7d
PORT=4000
WEB_ORIGIN=https://temporario.example
APP_TIMEZONE=America/Sao_Paulo
GOOGLE_CALENDAR_ENABLED=false
NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED=false
NEXT_PUBLIC_API_URL=/api
```

Importante: `JWT_SECRET` precisa ter pelo menos 32 caracteres. Se ficar curto, a API nao sobe em `NODE_ENV=production`.

## 3. Rodar banco e migrations

Confirme que o MySQL local esta ativo e acessivel com as credenciais do `.env`.

Depois rode:

```bash
npm run migration:run
```

## 4. Build do frontend

O frontend deve usar API relativa:

```text
NEXT_PUBLIC_API_URL=/api
```

Depois rode:

```bash
npm run build --workspace apps/web
```

Isso gera os arquivos estaticos em:

```text
apps/web/out
```

## 5. Criar o Caddyfile do proxy local

Crie um arquivo chamado `Caddyfile.local` na raiz do projeto:

```caddyfile
:8080 {
  encode gzip

  header {
    Strict-Transport-Security "max-age=15552000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "no-referrer"
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy-Report-Only "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  }

  handle /api/* {
    reverse_proxy 127.0.0.1:4000
  }

  handle {
    root * /home/sidney/automacoes/saas/duolar/apps/web/out
    try_files {path} {path}/ /index.html
    file_server
  }
}
```

Esse Caddy local escuta em:

```text
http://127.0.0.1:8080
```

Ele entrega:

- frontend em `/`;
- API em `/api`.

Por isso o ngrok precisa expor apenas um link.

## 6. Subir Caddy e ngrok com um comando

O projeto tem um script que sobe o Caddy local, sobe o ngrok, pega a URL HTTPS e atualiza `WEB_ORIGIN` em `apps/api/.env`.

Ele **nao sobe a API**. A API continua sendo iniciada manualmente por voce.

Na raiz do projeto, rode:

```bash
npm run public:tunnel
```

Se quiser forcar um novo build do frontend antes de subir o tunnel:

```bash
npm run public:tunnel -- --build
```

Quando o script terminar de preparar tudo, ele vai mostrar:

- a URL HTTPS externa;
- o arquivo `.env` atualizado;
- o comando para subir a API;
- os comandos de teste.

Deixe esse terminal aberto. Para encerrar Caddy e ngrok, pressione `Ctrl+C`.

## 7. Subir a API local

Em outro terminal:

```bash
NODE_ENV=production npm run start --workspace apps/api
```

A API fica em:

```text
http://127.0.0.1:4000/api
```

Nao exponha essa porta diretamente para internet.

## 8. Testar a URL externa

Use a URL exibida pelo script:

```bash
curl -I https://abc123.ngrok-free.app/
curl -I https://abc123.ngrok-free.app/api/health
```

Troque `https://abc123.ngrok-free.app` pela URL real do ngrok.

Se os dois comandos responderem, o link unico esta funcionando.

## 9. Modo manual, se precisar

### Subir o Caddy local

Em um terminal, na raiz do projeto:

```bash
caddy run --config Caddyfile.local
```

Teste localmente:

```bash
curl -I http://127.0.0.1:8080/
```

Se a API ainda nao estiver ligada, `/api/health` pode falhar por enquanto. Isso e normal nesta ordem.

### Criar a URL HTTPS externa com ngrok

Em outro terminal:

```bash
ngrok http 8080
```

O ngrok vai mostrar algo parecido com:

```text
Forwarding  https://abc123.ngrok-free.app -> http://localhost:8080
```

Copie a URL HTTPS:

```text
https://abc123.ngrok-free.app
```

Essa sera a URL externa para seus amigos.

## 8. Atualizar WEB_ORIGIN com a URL real

Agora edite `apps/api/.env` e troque:

```text
WEB_ORIGIN=https://temporario.example
```

por:

```text
WEB_ORIGIN=https://abc123.ngrok-free.app
```

Use a URL real que apareceu no seu ngrok.

## 10. Ordem dos terminais

Deixe estes processos rodando:

1. MySQL local.
2. Caddy:
   ```bash
   caddy run --config Caddyfile.local
   ```
3. ngrok:
   ```bash
   ngrok http 8080
   ```
4. API:
   ```bash
   NODE_ENV=production npm run start --workspace apps/api
   ```

Se o ngrok trocar a URL, atualize `WEB_ORIGIN` e reinicie a API.

## 11. Criar convite

Para criar um convite de uso unico:

```bash
npm run admin --workspace apps/api -- create-invite amigo@email.com
```

O comando retorna algo assim:

```json
{
  "id": "id-do-convite",
  "email": "amigo@email.com",
  "token": "token-do-convite"
}
```

Envie para seu amigo:

- a URL HTTPS do tunnel;
- o token do convite;
- o e-mail exato usado no convite.

O convite so funciona para aquele e-mail e so pode ser usado uma vez.

## 12. Revogar convite

Se voce criou um convite errado ou nao quer mais permitir uso:

```bash
npm run admin --workspace apps/api -- revoke-invite <id-ou-token-do-convite>
```

## 13. Desativar ou reativar usuario

Desativar usuario:

```bash
npm run admin --workspace apps/api -- disable-user amigo@email.com
```

Isso tambem revoga sessoes ativas.

Reativar usuario:

```bash
npm run admin --workspace apps/api -- enable-user amigo@email.com
```

## 15. Alterar senha

Reset local de senha:

```bash
npm run admin --workspace apps/api -- reset-password amigo@email.com "nova-senha-segura"
```

Isso revoga sessoes ativas do usuario.

## 16. Exportar ou apagar usuario

Exportar dados do usuario:

```bash
npm run admin --workspace apps/api -- export-user amigo@email.com
```

Apagar usuario:

```bash
npm run admin --workspace apps/api -- delete-user amigo@email.com
```

Use com cuidado. Nao ha backup nesta fase.

## 17. Checklist antes de divulgar

Rode:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep --config p/security-audit --config p/owasp-top-ten /src
docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep --config p/secrets /src
```

O `npm audit` ainda tem pendencias conhecidas em dependencias do Next/tooling. Antes de abrir para mais gente, resolva esse upgrade separadamente.

## 18. Mensagem para enviar

Modelo simples:

```text
O DuoLar esta em teste e sem backup por enquanto.

Link: https://<url-do-tunnel>
E-mail do convite: <email>
Convite: <token>

Se der erro ou precisar trocar senha, me avisa que eu resolvo manualmente.
```

## 19. Quando terminar o teste

Para parar a publicacao:

1. encerre o tunnel;
2. encerre o proxy;
3. encerre a API;
4. se necessario, desative usuarios ou revogue convites.

Sem tunnel ativo, seus amigos nao conseguem acessar sua maquina por esse link.

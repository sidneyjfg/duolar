# SECURITY_PLAN.md

Plano de seguranca do DuoLar antes da primeira publicacao externa para amigos.

Estado deste documento: planejamento aprovado para revisao. Nenhuma correcao foi implementada por este arquivo.

## 1. Resumo executivo

O DuoLar e um monorepo com frontend Next.js estatico e backend Bun/Elysia usando TypeORM/MySQL. A primeira publicacao sera self-host na maquina do operador, acessivel por uma URL HTTPS gratuita de tunnel. O modelo de seguranca aprovado para esta fase e usuario individual como unico tenant; "responsaveis" sao labels internos, nao contas separadas.

Principais riscos antes de expor o sistema:

- Autenticacao atual usa JWT Bearer persistido no frontend, sem revogacao server-side.
- Cadastro e login publicos nao tem rate limit, convite, lockout ou protecao contra enumeracao.
- Google Calendar armazena tokens OAuth e deve ficar desativado para convidados ate revisao de seguranca.
- Variaveis de ambiente tem defaults inseguros para producao, incluindo `JWT_SECRET`.
- Container da API roda sem `USER` nao-root.
- Dependencias incluem vulnerabilidades conhecidas, principalmente em `next`.
- Ha um core dump local em `apps/web/core`, nao rastreado, que pode conter memoria sensivel.
- CI usa GitHub Actions por tags mutaveis.
- Nao havera backup na primeira fase; perda da maquina/banco pode causar perda permanente de dados. Este risco foi aceito.

Objetivo da Fase 1: permitir acesso externo com seguranca aceitavel para poucos amigos, sem prometer robustez de SaaS publico.

## 2. Arquitetura e superficies de ataque

### Componentes

- Frontend: `apps/web`, Next.js 14, React, Tailwind, Axios, Zustand, TanStack Query, export estatico.
- Backend: `apps/api`, Bun, Elysia, TypeScript, TypeORM, MySQL, JWT, bcrypt, class-validator.
- Banco: MySQL local, nao exposto publicamente.
- Integracao externa: Google Calendar OAuth, atualmente planejada para ficar desativada para convidados.
- Exposicao publica: uma URL HTTPS gratuita de tunnel apontando para um proxy local unico.
- Proxy local planejado: um servico local em uma porta unica servindo:
  - `/` para frontend estatico;
  - `/api` para backend local.

### Superficies de ataque

- Endpoints publicos de auth: registro, login.
- Callback publico do Google Calendar.
- Endpoints privados protegidos por autenticacao.
- Frontend estatico publico.
- Proxy/tunnel HTTPS.
- MySQL local.
- Arquivos `.env` locais.
- GitHub Actions.
- Dockerfile e docker-compose.
- Dependencias npm.
- Artefatos locais como core dumps e logs.

## 3. Fluxo de autenticacao e autorizacao atual

### Estado atual

- `POST /api/auth/register` cria usuario e retorna JWT.
- `POST /api/auth/login` valida bcrypt e retorna JWT.
- JWT e assinado com `JWT_SECRET` e contem `sub`.
- Frontend salva `user` e `token` via Zustand persistido em `duolar-session`.
- Axios injeta `Authorization: Bearer <token>` em cada request.
- Backend usa `requireUser()` para verificar Bearer token e carregar o usuario.
- Logout e client-side: remove token do storage. Nao ha invalidacao server-side.

### Autorizacao atual

- Nao ha organizacao, papel, admin ou RBAC.
- Cada service filtra recursos por `user.id`.
- Decisao aprovada: nesta fase o tenant e o usuario individual. Labels de responsaveis nao representam usuarios com acesso.

### Estado desejado

- Sessao por cookie HttpOnly, Secure, SameSite, com sessao/revogacao server-side.
- Cadastro fechado por convite por e-mail, uso unico.
- Scripts locais para criar/revogar convite, desativar/reativar usuario, resetar senha, exportar/apagar usuario.
- Rate limit por IP + e-mail para login, registro e uso de convite.
- Mensagens publicas genericas para falhas sensiveis.

## 4. Inventario de endpoints e nivel de protecao

Base API: `/api`.

| Metodo | Endpoint | Protecao atual | Observacao |
| --- | --- | --- | --- |
| GET | `/health` | Publico | Health check simples. |
| POST | `/auth/register` | Publico | Deve exigir convite unico. |
| POST | `/auth/login` | Publico | Deve ter rate limit e mensagem generica. |
| GET | `/auth/me` | JWT Bearer | Retorna usuario sem senha. |
| PATCH | `/auth/me` | JWT Bearer | Atualiza responsaveis/labels. |
| GET | `/tasks` | JWT Bearer | Service filtra por `user.id`. |
| POST | `/tasks` | JWT Bearer | Validacao DTO parcial. |
| GET | `/tasks/balance` | JWT Bearer | Filtra por usuario. |
| GET | `/tasks/day` | JWT Bearer | Filtra por usuario. |
| PATCH | `/tasks/:id/complete` | JWT Bearer | Busca `id` + `user.id`. |
| PATCH | `/tasks/:id` | JWT Bearer | Busca `id` + `user.id`. |
| DELETE | `/tasks/:id` | JWT Bearer | Busca `id` + `user.id`. |
| GET | `/shopping` | JWT Bearer | Filtra por usuario. |
| POST | `/shopping` | JWT Bearer | Validacao DTO parcial. |
| GET | `/shopping/history` | JWT Bearer | Filtra por usuario. |
| POST | `/shopping/finish` | JWT Bearer | Filtra por usuario. |
| PATCH | `/shopping/:id` | JWT Bearer | Busca `id` + `user.id`. |
| DELETE | `/shopping/:id` | JWT Bearer | Busca `id` + `user.id`. |
| GET | `/finances` | JWT Bearer | Filtra por usuario. |
| POST | `/finances` | JWT Bearer | Validacao DTO parcial. |
| GET | `/finances/summary` | JWT Bearer | Filtra por usuario. |
| PATCH | `/finances/:id` | JWT Bearer | Busca `id` + `user.id`. |
| DELETE | `/finances/:id` | JWT Bearer | Busca `id` + `user.id`. |
| GET | `/agenda` | JWT Bearer | Filtra por usuario e data opcional. |
| POST | `/agenda` | JWT Bearer | Pode sincronizar Google Calendar. |
| PATCH | `/agenda/:id` | JWT Bearer | Busca `id` + `user.id`. |
| DELETE | `/agenda/:id` | JWT Bearer | Busca `id` + `user.id`. |
| GET | `/personal-rules` | JWT Bearer | Filtra por usuario. |
| POST | `/personal-rules` | JWT Bearer | Validacao DTO parcial. |
| PATCH | `/personal-rules/:id` | JWT Bearer | Busca `id` + `user.id`. |
| PATCH | `/personal-rules/:id/check-in` | JWT Bearer | Busca `id` + `user.id`. |
| DELETE | `/personal-rules/:id` | JWT Bearer | Busca `id` + `user.id`. |
| GET | `/insights` | JWT Bearer | Agrega services filtrados por usuario. |
| GET | `/integrations/google-calendar` | JWT Bearer | Deve ficar desativado para convidados. |
| GET | `/integrations/google-calendar/connect` | JWT Bearer | Deve ficar desativado para convidados. |
| GET | `/integrations/google-calendar/callback` | Publico + OAuth state | Deve respeitar feature flag. |
| DELETE | `/integrations/google-calendar/:id` | JWT Bearer | Busca `id` + `user.id`. |

## 5. Achados confirmados

### SEC-001: Sessao JWT persistida no frontend sem revogacao

- Criticidade: alta.
- Categoria: OWASP A07 Identification and Authentication Failures; CWE-922/CWE-613.
- Arquivos/linhas: `apps/web/store/auth-store.ts:15-23`, `apps/web/lib/api.ts:8-10`, `apps/api/src/utils/jwt.ts:4-10`, `apps/api/src/http/auth.ts:68-82`.
- Evidencia: token salvo por Zustand persistido e enviado como Bearer; logout apenas apaga estado local.
- Cenario realista: XSS ou extensao maliciosa rouba token persistido; atacante usa token ate expirar.
- Impacto: acesso completo aos dados do usuario; sem revogacao imediata.
- Probabilidade: media.
- Correcao recomendada: cookie HttpOnly `Secure` + `SameSite`, sessao server-side, revogacao, invalidacao ao desativar usuario.
- Arquivos a alterar: `apps/api/src/routes/auth.routes.ts`, `apps/api/src/services/AuthService.ts`, `apps/api/src/http/auth.ts`, nova entidade/tabela de sessoes, `apps/web/lib/api.ts`, `apps/web/store/auth-store.ts`, chamadas de login/logout.
- Efeitos colaterais: mudanca de contrato de auth no frontend; exige `credentials` e CSRF.
- Testes: login cria cookie; JS nao le token; logout revoga sessao; usuario desativado perde acesso; requests sem cookie falham.
- Dependencias: SEC-002, SEC-004, SEC-008.
- Status: confirmado.
- Rollback: manter endpoint Bearer antigo temporariamente atras de flag local ate migracao validada.

### SEC-002: Cadastro publico sem convite

- Criticidade: alta.
- Categoria: OWASP A04 Insecure Design; abuso de recurso.
- Arquivos/linhas: `apps/api/src/routes/auth.routes.ts:10-14`, `apps/api/src/services/AuthService.ts:19-33`.
- Evidencia: qualquer pessoa pode criar conta com nome, e-mail e senha.
- Cenario realista: URL publica vaza; bots criam contas e consomem banco/CPU.
- Impacto: abuso de recursos, dados lixo, superficie de brute force.
- Probabilidade: alta apos exposicao publica.
- Correcao recomendada: convites por e-mail, uso unico, criados/revogados por script local; registro exige convite valido.
- Arquivos a alterar: Auth DTO/service/route; nova entidade/tabela `invites`; scripts locais.
- Efeitos colaterais: frontend precisa campo de convite ou fluxo por token.
- Testes: convite valido cria conta e marca usado; convite reutilizado falha; e-mail diferente falha; convite revogado falha.
- Dependencias: SEC-004, SEC-006, SEC-015.
- Status: confirmado.
- Rollback: feature flag para permitir registro apenas em ambiente local.

### SEC-003: Ausencia de rate limiting em login/registro/convite

- Criticidade: alta.
- Categoria: OWASP A07; CWE-307.
- Arquivos/linhas: `apps/api/src/routes/auth.routes.ts:10-18`.
- Evidencia: endpoints publicos nao aplicam limite de tentativas.
- Cenario realista: brute force de senha ou convite via tunnel publico.
- Impacto: comprometimento de conta, DoS leve na maquina self-host.
- Probabilidade: alta.
- Correcao recomendada: rate limit em memoria por IP + e-mail para auth; depois proxy/tunnel se disponivel.
- Arquivos a alterar: novo middleware/util de rate limit; rotas de auth.
- Efeitos colaterais: usuarios legitimos podem receber 429 se limite baixo.
- Testes: N tentativas falham com 429; chaves por IP/e-mail separadas; reinicio limpa memoria.
- Dependencias: proxy deve repassar IP real de forma confiavel.
- Status: confirmado.
- Rollback: reduzir agressividade ou desativar via env em dev.

### SEC-004: Sem revogacao/desativacao de usuario e reset manual

- Criticidade: alta.
- Categoria: OWASP A01 Broken Access Control; OWASP A07.
- Arquivos/linhas: `apps/api/src/entities/User.ts:9-24`, `apps/api/src/http/auth.ts:79-82`, `apps/api/src/services/AuthService.ts:35-43`.
- Evidencia: entidade User nao tem `disabledAt`/`isActive`; auth nao checa estado.
- Cenario realista: amigo perde acesso ou token vaza; operador nao consegue revogar sem editar banco.
- Impacto: acesso indevido persistente.
- Probabilidade: media.
- Correcao recomendada: adicionar status de usuario, scripts locais de ativar/desativar/resetar senha, invalidacao de sessoes.
- Arquivos a alterar: entidade User, migration, auth service, scripts.
- Efeitos colaterais: usuarios desativados devem receber resposta generica no login.
- Testes: usuario desativado nao loga; sessoes existentes falham; reativacao funciona.
- Dependencias: SEC-001.
- Status: confirmado.
- Rollback: script de reativacao local.

### SEC-005: Enumeracao de e-mail no cadastro

- Criticidade: media.
- Categoria: OWASP A01/A07; CWE-203.
- Arquivos/linhas: `apps/api/src/services/AuthService.ts:21-22`.
- Evidencia: cadastro retorna `E-mail ja cadastrado` com 409.
- Cenario realista: atacante testa lista de e-mails para descobrir usuarios.
- Impacto: privacidade e alvo para brute force/phishing.
- Probabilidade: media.
- Correcao recomendada: mensagens publicas genericas para auth/convite; logs internos minimizados.
- Arquivos a alterar: AuthService, error formatter, frontend messages.
- Efeitos colaterais: UX menos especifica.
- Testes: e-mail existente, convite invalido, senha errada retornam mensagens genericas.
- Dependencias: SEC-002, SEC-006.
- Status: confirmado.
- Rollback: manter detalhes apenas em dev.

### SEC-006: Falta de logs de seguranca minimizados

- Criticidade: media.
- Categoria: OWASP Security Logging and Monitoring Failures.
- Arquivos/linhas: `apps/api/src/server.ts:7-12` mostra apenas logs operacionais basicos.
- Evidencia: nao ha logging estruturado de falhas de login, convite, revogacao, rate limit.
- Cenario realista: abuso ocorre e operador nao consegue investigar.
- Impacto: deteccao e resposta fracas.
- Probabilidade: media.
- Correcao recomendada: logger local estruturado e minimizado, sem senha/token/convite completo/payload financeiro.
- Arquivos a alterar: novo logger, AuthService, rate limit, scripts locais.
- Efeitos colaterais: retencao de logs vira dado pessoal.
- Testes: eventos gravam campos permitidos; secrets nao aparecem.
- Dependencias: SEC-002, SEC-003, SEC-004.
- Status: confirmado.
- Rollback: log para stdout apenas em dev.

### SEC-007: Defaults inseguros de producao

- Criticidade: alta.
- Categoria: CWE-798; OWASP A05 Security Misconfiguration.
- Arquivos/linhas: `apps/api/src/config/env.ts:7-24`.
- Evidencia: defaults como `jwtSecret: process.env.JWT_SECRET ?? "dev-secret"` e credenciais DB `duolar`.
- Cenario realista: API publica sem env correta usa segredo conhecido; tokens podem ser forjados.
- Impacto: comprometimento total da autenticacao e dados.
- Probabilidade: media.
- Correcao recomendada: validar env obrigatoria em `NODE_ENV=production`; falhar startup se segredo fraco/default; separar env dev/prod.
- Arquivos a alterar: `env.ts`, docs deploy, `.env.example`.
- Efeitos colaterais: setup local precisa defaults explicitamente dev.
- Testes: producao sem env falha; dev continua facil.
- Dependencias: SEC-001 e Google token encryption.
- Status: confirmado.
- Rollback: flag `ALLOW_INSECURE_DEV_DEFAULTS=true` apenas em dev.

### SEC-008: Google Calendar OAuth deve ficar desativado para convidados

- Criticidade: alta.
- Categoria: OWASP A01/A02; protecao de tokens OAuth.
- Arquivos/linhas: `apps/api/src/services/GoogleCalendarService.ts:11`, `:97-147`, `:242-249`; `apps/api/src/routes/google-calendar.routes.ts:203-219`.
- Evidencia: app solicita `calendar.events` e `userinfo.email`, armazena access/refresh token criptografados no banco.
- Cenario realista: se maquina, banco, env ou API forem comprometidos, tokens Google podem ser recuperados e usados para criar/editar/apagar eventos.
- Impacto: acesso indevido a calendarios Google conectados.
- Probabilidade: media.
- Correcao recomendada: feature flag para desativar integracao para convidados; UI mostrar aviso de indisponibilidade por revisao de seguranca.
- Arquivos a alterar: rotas/service Google, frontend agenda/settings, env docs.
- Efeitos colaterais: perde funcionalidade de sincronizacao para amigos.
- Testes: endpoints retornam 403/503 quando flag off; UI nao inicia OAuth; usuario operador pode ser permitido por allowlist se decidido.
- Dependencias: SEC-007 e SEC-016.
- Status: confirmado.
- Rollback: reativar flag para usuario operador apos hardening.

### SEC-009: AES-GCM sem `authTagLength`

- Criticidade: media.
- Categoria: CWE-310; OWASP A02 Cryptographic Failures.
- Arquivos/linhas: `apps/api/src/services/GoogleCalendarService.ts:26-41`.
- Evidencia Semgrep: `createDecipheriv("aes-256-gcm", ...)` sem `authTagLength`.
- Cenario realista: tag GCM curta pode ser aceita em alguns cenarios se payload manipulado.
- Impacto: risco de forja/validacao criptografica inadequada.
- Probabilidade: baixa/media.
- Correcao recomendada: especificar `{ authTagLength: 16 }`, validar tamanho minimo do payload e separar chave de criptografia de `JWT_SECRET`.
- Arquivos a alterar: GoogleCalendarService, env, docs, migration/rotacao se necessario.
- Efeitos colaterais: tokens ja criptografados devem continuar descriptografando se formato igual; testar compatibilidade.
- Testes: decrypt token antigo; payload truncado falha; round-trip encrypt/decrypt.
- Dependencias: SEC-008, SEC-007.
- Status: confirmado pelo codigo e Semgrep.
- Rollback: manter fallback de leitura legado por uma release.

### SEC-010: Dockerfile roda como root

- Criticidade: media.
- Categoria: CWE-250; Docker hardening.
- Arquivos/linhas: `apps/api/Dockerfile:1-18`.
- Evidencia Semgrep: nao ha `USER` nao-root antes do CMD.
- Cenario realista: RCE na API roda como root dentro do container.
- Impacto: maior impacto em escape/volume/permissoes.
- Probabilidade: baixa/media.
- Correcao recomendada: criar/usar usuario nao-root no container, ajustar ownership.
- Arquivos a alterar: Dockerfile, possivelmente docker-compose.
- Efeitos colaterais: permissao de escrita/cache Bun pode quebrar se nao ajustada.
- Testes: container sobe; API conecta DB; usuario efetivo nao e root.
- Dependencias: nenhuma.
- Status: confirmado por Semgrep.
- Rollback: temporario para root apenas em dev, nunca no plano publico.

### SEC-011: GitHub Actions usa tags mutaveis

- Criticidade: media.
- Categoria: CWE-1357/CWE-353; OWASP A08 Software and Data Integrity Failures.
- Arquivos/linhas: `.github/workflows/deploy-web-pages.yml:28`, `:31`, `:40`, `:65`, `:78`.
- Evidencia Semgrep: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`.
- Cenario realista: action/tag comprometida ou repontada executa codigo malicioso no CI.
- Impacto: comprometimento do deploy e possivel exposicao de variaveis.
- Probabilidade: baixa/media.
- Correcao recomendada: pin por SHA completo; manter atualizacao manual controlada.
- Arquivos a alterar: workflow.
- Efeitos colaterais: manutencao mais manual.
- Testes: workflow roda apos pinning.
- Dependencias: CI security phase.
- Status: confirmado por Semgrep.
- Rollback: voltar tag apenas em emergencia.

### SEC-012: Dependencias vulneraveis

- Criticidade: alta para `next`; media/baixa para demais conforme uso.
- Categoria: OWASP A06 Vulnerable and Outdated Components.
- Arquivos/linhas: `package.json`, `apps/web/package.json`, `package-lock.json`.
- Evidencia: `npm audit --workspaces --json` reportou 9 vulnerabilidades: `next`, `eslint-config-next/glob`, `form-data`, `js-yaml`, `qs`, `esbuild`, `postcss` indireto.
- Cenario realista: DoS/SSRF/XSS/cache poisoning conforme CVE e configuracao.
- Impacto: disponibilidade e possiveis falhas web.
- Probabilidade: media.
- Correcao recomendada: atualizar Next para versao corrigida compativel ou planejar major com testes; rodar audit novamente; avaliar advisories nao aplicaveis ao export estatico.
- Arquivos a alterar: package manifests/lockfile; possivelmente codigo Next se major.
- Efeitos colaterais: major upgrade pode quebrar build/export.
- Testes: typecheck, lint, build, smoke do frontend, audit limpo/aceito.
- Dependencias: nenhuma, mas deve preceder publicacao.
- Status: confirmado pelo npm audit; aplicabilidade de alguns CVEs precisa triagem.
- Rollback: reverter lockfile/versoes se build falhar.

### SEC-013: Core dump local no projeto

- Criticidade: media.
- Categoria: exposicao de dados sensiveis; hardening operacional.
- Arquivos/linhas: `apps/web/core` detectado por `file`; nao rastreado.
- Evidencia: ELF core file de 10 MB com permissao local.
- Cenario realista: arquivo entra em zip, upload, debug, backup ou build context por engano.
- Impacto: memoria pode conter env, tokens, dados pessoais.
- Probabilidade: media.
- Correcao recomendada: remover arquivo local apos confirmacao operacional; adicionar `core`, `core.*`, dumps e logs sensiveis a `.gitignore` e `.dockerignore`.
- Arquivos a alterar: `.gitignore`, `.dockerignore`; remocao local manual do arquivo.
- Efeitos colaterais: nenhum funcional.
- Testes: `git status` nao mostra dumps; docker build context nao inclui dumps.
- Dependencias: nenhuma.
- Status: confirmado.
- Rollback: nao aplicavel; core dump nao deve ser preservado no projeto.

### SEC-014: Headers de seguranca incompletos

- Criticidade: media.
- Categoria: OWASP A05 Security Misconfiguration; XSS defense-in-depth.
- Arquivos/linhas: `apps/api/src/http/security.ts:37-46` no output numerado combinado; origem real `apps/api/src/http/security.ts`.
- Evidencia: API define `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, mas nao CSP, HSTS, COOP/CORP.
- Cenario realista: XSS ou clickjacking mitigacoes incompletas; frontend estatico pode sair sem headers.
- Impacto: aumenta impacto de falhas client-side.
- Probabilidade: media.
- Correcao recomendada: aplicar headers no proxy local; CSP controlada/report-only inicialmente; HSTS apenas em HTTPS externo.
- Arquivos a alterar: config do proxy, docs; possivelmente API headers.
- Efeitos colaterais: CSP rigida pode quebrar Next/static styles/scripts.
- Testes: curl valida headers; app carrega sem violacoes criticas.
- Dependencias: proxy unico/tunnel.
- Status: confirmado.
- Rollback: CSP report-only/permissiva.

### SEC-015: Validacao sem limites maximos em varios campos

- Criticidade: media.
- Categoria: CWE-400 Uncontrolled Resource Consumption; validacao de entrada.
- Arquivos/linhas: DTOs em `apps/api/src/dtos/*.ts`, muitos campos `@IsString()` sem `@MaxLength`.
- Evidencia: campos como title, notes, description, condition/reward text nao tem tamanho maximo.
- Cenario realista: atacante autenticado envia strings muito grandes e degrada banco/UI/logs.
- Impacto: DoS leve, aumento de armazenamento, UI quebrada.
- Probabilidade: media.
- Correcao recomendada: limites por campo e arrays; padronizar validacao 422.
- Arquivos a alterar: DTOs, frontend forms, testes.
- Efeitos colaterais: dados antigos acima do limite podem precisar migracao/trim.
- Testes: payload grande retorna 422; valores normais passam.
- Dependencias: SEC-017.
- Status: confirmado.
- Rollback: ajustar limites se muito restritivos.

### SEC-016: Dados pessoais e LGPD minima

- Criticidade: media.
- Categoria: privacidade/LGPD operacional.
- Arquivos/linhas: entidades de User, Task, Shopping, Finance, Agenda, PersonalRule.
- Evidencia: app armazena nome, e-mail, tarefas, agenda, compras, financas, regras pessoais.
- Cenario realista: amigo pede copia/exclusao; operador precisa responder sem mexer manualmente no banco.
- Impacto: risco legal/relacional e operacional.
- Probabilidade: media.
- Correcao recomendada: scripts locais de exportar/apagar usuario por e-mail; aviso curto: "em teste" e "sem backup".
- Arquivos a alterar: scripts, docs, talvez UI aviso.
- Efeitos colaterais: apagar usuario remove dados por cascade.
- Testes: export JSON completo; delete remove dados e sessoes; usuario nao consegue logar depois.
- Dependencias: SEC-004.
- Status: confirmado.
- Rollback: restauracao nao disponivel sem backup; risco aceito.

### SEC-017: Erros sensiveis e detalhes de validacao

- Criticidade: media.
- Categoria: CWE-209 Information Exposure Through Error Message.
- Arquivos/linhas: `apps/api/src/http/errors.ts:53-61`, `apps/api/src/utils/validate.ts`.
- Evidencia: `AppError` retorna `details` sempre; validacao retorna constraints cruas.
- Cenario realista: atacante usa respostas para mapear schema e estados de auth/convite.
- Impacto: facilita enumeracao e fuzzing.
- Probabilidade: media.
- Correcao recomendada: 422 padronizado `{ field, code, message }`; auth/convite/rate limit/Google com respostas publicas genericas.
- Arquivos a alterar: validate util, error formatter, services de auth.
- Efeitos colaterais: frontend deve adaptar exibicao de erro.
- Testes: validacao ainda exibe erro de campo; auth nao revela causa.
- Dependencias: SEC-005.
- Status: confirmado.
- Rollback: detalhes completos somente em dev.

### SEC-018: MySQL deve ficar local e com usuario limitado

- Criticidade: alta se exposto; media como hardening planejado.
- Categoria: configuracao de infraestrutura.
- Arquivos/linhas: `docker-compose.yml:8-15`, `docs/deploy.md`.
- Evidencia: Compose expoe apenas API; banco e externo/local. Decisao aprovada: MySQL local.
- Cenario realista: se MySQL for exposto por engano, fica alvo de brute force.
- Impacto: comprometimento total dos dados.
- Probabilidade: baixa se plano seguido.
- Correcao recomendada: nao expor MySQL no tunnel/roteador; bind local; usuario DB limitado ao schema `duolar`, sem root.
- Arquivos a alterar: docs, scripts operacionais, talvez compose.
- Efeitos colaterais: migracoes precisam usuario com permissoes adequadas.
- Testes: porta MySQL nao acessivel externamente; API conecta localmente.
- Dependencias: proxy/tunnel.
- Status: decisao operacional confirmada.
- Rollback: nenhum para publicacao; exposicao direta nao aceita.

## 6. Possiveis falsos positivos / baixo impacto

- `next` advisories relacionados a image optimizer, WebSocket upgrades, rewrites, middleware e i18n: o projeto usa `output: "export"`, `images.unoptimized`, nao tem middleware, rewrites ou WebSocket no codigo. Ainda assim `next` deve ser atualizado antes de publicar porque advisories tambem incluem RSC/DoS e XSS em App Router.
- `glob` via `eslint-config-next`: dependencia de dev/CI, nao runtime. Risco primario e supply chain/CI, nao usuario final. Corrigir por upgrade.
- `esbuild` Windows dev-server arbitrary file read: baixo impacto se producao nao roda esbuild dev server em Windows. Corrigir via audit/lock.
- `js-yaml`, `qs`, `form-data`: sem uso direto identificado no codigo de aplicacao. Corrigir via update transitive; classificar aplicabilidade apos `npm why`.
- Semgrep secrets: 0 achados em arquivos rastreados. `.env` locais estao ignorados. Nao expor valores no relatorio.

## 7. Matriz de risco

| ID | Criticidade | Probabilidade | Impacto | Fase |
| --- | --- | --- | --- | --- |
| SEC-007 | Alta | Media | Critico | 0 |
| SEC-001 | Alta | Media | Alto | 1 |
| SEC-002 | Alta | Alta | Alto | 0/1 |
| SEC-003 | Alta | Alta | Alto | 1 |
| SEC-004 | Alta | Media | Alto | 1 |
| SEC-008 | Alta | Media | Alto | 0 |
| SEC-012 | Alta | Media | Alto | 1 |
| SEC-018 | Alta se exposto | Baixa | Critico | 0 |
| SEC-005 | Media | Media | Medio | 1 |
| SEC-006 | Media | Media | Medio | 2 |
| SEC-009 | Media | Baixa/Media | Medio | 2 |
| SEC-010 | Media | Baixa/Media | Medio | 1 |
| SEC-011 | Media | Baixa/Media | Alto | 2 |
| SEC-013 | Media | Media | Medio | 0 |
| SEC-014 | Media | Media | Medio | 2 |
| SEC-015 | Media | Media | Medio | 1 |
| SEC-016 | Media | Media | Medio | 1 |
| SEC-017 | Media | Media | Medio | 1 |

## 8. Plano de correcao por fases

### Fase 0 - Acoes imediatas

1. Nao expor API/MySQL diretamente.
2. Configurar decisao operacional: uma URL HTTPS de tunnel para proxy local unico.
3. Desativar Google Calendar para convidados por feature flag e aviso no sistema.
4. Exigir env de producao forte; remover defaults inseguros em producao.
5. Limpar/ignorar core dumps e artefatos locais sensiveis.
6. Definir MySQL local nao exposto e usuario limitado.

### Fase 1 - Antes de publicar

1. Migrar auth para cookie HttpOnly + sessoes server-side + revogacao.
2. Implementar convite por e-mail/uso unico.
3. Implementar scripts locais:
   - criar convite;
   - revogar convite;
   - desativar/reativar usuario;
   - resetar senha;
   - exportar usuario;
   - apagar usuario.
4. Implementar rate limit em memoria por IP + e-mail para login, registro e convite.
5. Padronizar mensagens sensiveis e validacao.
6. Adicionar limites maximos em DTOs e frontend.
7. Atualizar dependencias vulneraveis ou registrar excecoes justificadas.
8. Rodar container como nao-root.
9. Garantir `NEXT_PUBLIC_API_URL=/api` e proxy local roteando `/api`.
10. Aviso curto de MVP: "em teste" e "sem backup".

### Fase 2 - Fortalecimento

1. Headers/CSP no proxy, preferencialmente report-only no inicio.
2. Logs de seguranca locais minimizados.
3. CI leve de seguranca: typecheck, lint, audit, Semgrep em modo relatorio.
4. Pin de GitHub Actions por SHA.
5. Melhorar criptografia Google: `authTagLength`, chave separada, rotacao.
6. Rate limit tambem no proxy/tunnel se disponivel.

### Fase 3 - Evolucao futura

1. Multiusuario real: `household`, membership, convites, roles, RBAC.
2. Admin UI protegida, se necessario.
3. Recuperacao publica de senha com tokens seguros e e-mail transacional.
4. Reativar Google Calendar para convidados apos hardening e consentimento explicito.
5. Backup criptografado com retencao curta, caso deixe de ser risco aceito.
6. Politica de privacidade formal, export/delete self-service.

## 9. Ordem exata de implementacao

1. Confirmar ambiente de execucao: proxy local unico + tunnel HTTPS.
2. Adicionar validacao de env para producao.
3. Desativar Google Calendar por feature flag.
4. Limpar/ignorar core dumps.
5. Criar tabelas de sessao e convite.
6. Migrar login/logout/me para cookie HttpOnly e sessao server-side.
7. Adaptar frontend para cookie/credentials e `NEXT_PUBLIC_API_URL=/api`.
8. Implementar convite por e-mail/uso unico.
9. Implementar scripts locais admin.
10. Implementar rate limit por IP + e-mail.
11. Padronizar erros e mensagens.
12. Adicionar limites de DTOs e UI.
13. Atualizar dependencias vulneraveis.
14. Ajustar Dockerfile para usuario nao-root.
15. Adicionar aviso MVP/teste/sem backup.
16. Adicionar logs minimizados.
17. Configurar proxy headers/CSP.
18. Adicionar CI de seguranca.
19. Pin de GitHub Actions por SHA.
20. Revisar Google crypto antes de reativar integracao.

## 10. Checklist por arquivo

### Backend

- `apps/api/src/config/env.ts`
  - Estado atual: defaults de dev podem vazar para producao.
  - Estado desejado: env obrigatoria em producao, segredo forte, flags explicitas.
  - Teste: startup falha sem env obrigatoria em `NODE_ENV=production`.
  - Rollback: permitir defaults apenas em dev.

- `apps/api/src/utils/jwt.ts`
  - Estado atual: assina/verifica JWT stateless.
  - Estado desejado: manter apenas se necessario para tokens internos curtos; auth principal por sessao.
  - Teste: token antigo nao autoriza endpoints apos migracao.
  - Rollback: rota legacy temporaria em dev.

- `apps/api/src/http/auth.ts`
  - Estado atual: Bearer token.
  - Estado desejado: cookie/session lookup, usuario ativo, sessao nao revogada.
  - Teste: cookie valido autoriza; sessao revogada falha.
  - Rollback: Bearer apenas local.

- `apps/api/src/routes/auth.routes.ts`
  - Estado atual: register/login publicos.
  - Estado desejado: convite, cookie, logout server-side, mensagens genericas.
  - Teste: fluxos de login/register/logout.

- `apps/api/src/services/AuthService.ts`
  - Estado atual: cria usuario e token; verifica senha.
  - Estado desejado: cria sessoes, convite, usuario ativo, logs minimizados.
  - Teste: usuario desativado e convite usado.

- `apps/api/src/dtos/*.ts`
  - Estado atual: varios campos sem max length.
  - Estado desejado: limites por campo/array.
  - Teste: payload gigante retorna 422.

- `apps/api/src/http/errors.ts` e `apps/api/src/utils/validate.ts`
  - Estado atual: detalhes crus.
  - Estado desejado: erros padronizados.
  - Teste: snapshots de erro.

- `apps/api/src/services/GoogleCalendarService.ts`
  - Estado atual: OAuth ativo, tokens criptografados com chave derivada de JWT secret.
  - Estado desejado: desativado por flag para convidados; crypto endurecida antes de reativar.
  - Teste: endpoints bloqueados por flag; encrypt/decrypt round-trip.

- `apps/api/Dockerfile`
  - Estado atual: sem `USER`.
  - Estado desejado: usuario nao-root.
  - Teste: container sobe como nao-root.

### Frontend

- `apps/web/store/auth-store.ts`
  - Estado atual: token persistido.
  - Estado desejado: sem token persistido; manter apenas user/cache de UI.
  - Teste: localStorage nao contem token.

- `apps/web/lib/api.ts`
  - Estado atual: baseURL pode ser localhost; injeta Bearer.
  - Estado desejado: baseURL `/api`; `withCredentials`; sem Authorization client-side.
  - Teste: request autenticado usa cookie.

- `apps/web/components/auth-screen.tsx`
  - Estado atual: login/register sem convite.
  - Estado desejado: campo/fluxo de convite, mensagens genericas.
  - Teste: UX de convite.

- `apps/web/components/duolar-app.tsx`
  - Estado atual: Google Calendar visivel.
  - Estado desejado: aviso/flag de indisponibilidade por revisao de seguranca.
  - Teste: botao OAuth indisponivel para convidados.

- `apps/web/next.config.mjs`
  - Estado atual: export estatico.
  - Estado desejado: manter export, garantir API relativa `/api`.
  - Teste: build e smoke via proxy.

### Infra

- `docker-compose.yml`
  - Estado atual: API exposta em `4000:4000`.
  - Estado desejado: para publicacao, API atras de proxy local; MySQL nao exposto.
  - Teste: somente proxy/tunnel exposto.

- `.github/workflows/deploy-web-pages.yml`
  - Estado atual: actions por tag.
  - Estado desejado: actions por SHA.
  - Teste: CI roda.

- `.gitignore` e `.dockerignore`
  - Estado atual: envs ignorados, mas core dumps nao.
  - Estado desejado: ignorar `core`, `core.*`, dumps/logs locais.
  - Teste: `git status` nao mostra dumps.

## 11. Testes de seguranca necessarios

- Auth:
  - login valido cria cookie HttpOnly;
  - cookie nao acessivel por JS;
  - logout revoga sessao;
  - sessao revogada falha;
  - usuario desativado falha;
  - mensagens de erro genericas.

- Convites:
  - convite valido por e-mail cria conta;
  - convite reutilizado falha;
  - convite revogado falha;
  - convite de outro e-mail falha;
  - rate limit bloqueia brute force.

- Autorizacao/IDOR:
  - usuario A nao le/altera/deleta recursos do usuario B em tasks, shopping, finances, agenda, rules, Google connection.
  - endpoints agregados so retornam dados do usuario autenticado.

- Validacao:
  - strings acima do limite retornam 422 padronizado;
  - campos extras sao rejeitados;
  - datas/horarios invalidos falham.

- Infra:
  - MySQL inacessivel externamente;
  - API acessivel so via proxy/tunnel;
  - HTTPS externo obrigatorio;
  - cookies `Secure` em ambiente publico;
  - headers presentes no proxy.

- Docker:
  - container roda como usuario nao-root;
  - build nao inclui `.env`, core dumps ou logs.

- Dependencias/CI:
  - `npm audit --workspaces --audit-level=high`;
  - Semgrep security-audit/OWASP;
  - typecheck/lint/build.

## 12. Comandos para validar correcoes

```bash
npm run typecheck
npm run lint
npm run build
npm audit --workspaces --audit-level=high
docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep --config p/security-audit --config p/owasp-top-ten /src
docker build -f apps/api/Dockerfile -t duolar-api-security-check .
docker run --rm duolar-api-security-check id
git status --short
git check-ignore -v .env apps/api/.env apps/web/.env.local apps/web/core core core.123 || true
```

Validacoes manuais via HTTP devem ser feitas depois de implementar proxy/tunnel:

```bash
curl -I https://<tunnel-url>/
curl -I https://<tunnel-url>/api/health
curl -i https://<tunnel-url>/api/auth/me
```

## 13. Criterios objetivos de aceite

- Nao existe token JWT persistido em localStorage/sessionStorage.
- Cookie de sessao e HttpOnly, Secure em acesso externo e SameSite configurado.
- Login/logout/revogacao/desativacao funcionam.
- Registro exige convite por e-mail/uso unico.
- Rate limit bloqueia abuso de login/registro/convite.
- Google Calendar nao pode ser conectado por convidados.
- MySQL nao esta exposto publicamente.
- Acesso externo usa HTTPS via tunnel.
- Frontend chama `/api`, nunca `localhost`.
- `NODE_ENV=production` falha sem secrets obrigatorios fortes.
- Container da API nao roda como root.
- `npm audit` nao tem vulnerabilidades altas sem justificativa documentada.
- Semgrep nao tem findings criticos/altos confirmados pendentes.
- Core dumps e `.env` nao entram no Git nem no Docker context.
- Scripts locais conseguem criar/revogar convite, desativar/reativar usuario, resetar senha, exportar/apagar usuario.
- Aviso curto informa que o sistema esta em teste e sem backup.

## 14. Riscos residuais

- Sem backup: perda de maquina/banco pode causar perda permanente de dados. Risco aceito.
- Tunnel gratuito pode mudar URL, ter limite ou indisponibilidade.
- Rate limit em memoria perde estado ao reiniciar API.
- Frontend estatico e publico; nenhuma regra sensivel pode depender dele.
- Sem multiusuario real nesta fase; "responsaveis" nao sao usuarios.
- Logs locais ainda sao dados pessoais minimizados; precisam retencao curta/manual.
- Google Calendar ficara desativado para convidados; se reativado sem hardening, risco volta.
- Dependencias podem ganhar novos CVEs; auditoria precisa ser repetida antes de publicar.

## 15. Itens que dependem de decisoes suas

Decisoes ja tomadas:

- Tenant inicial: usuario individual.
- Exposicao: uma URL HTTPS gratuita de tunnel.
- Proxy: frontend e API sob a mesma URL publica, API em `/api`.
- Cadastro: convite por e-mail/uso unico.
- Admin: scripts locais, sem endpoint/UI admin.
- Sessao: cookie HttpOnly + sessao/revogacao server-side.
- Google Calendar: desativado por enquanto para convidados, com aviso/flag.
- Financas: permitido, pois nao ha dados de cartao, mas ainda tratado como dado pessoal.
- Export/delete: scripts locais.
- Rate limit: memoria no backend agora, proxy depois.
- Rate limit keys: IP + e-mail.
- Mensagens auth: genericas.
- Logs: minimizados.
- Backup: nao tera backup nesta fase.
- Campos: adicionar limites maximos.
- Erros: validacao padronizada, sensiveis genericos.
- Frontend: publico e sem segredos.
- Headers/CSP: no proxy, gradual/report-only quando necessario.
- CI: leve antes de publicar, Semgrep inicialmente relatorio e critico confirmado bloqueante.
- Semgrep/npm audit: separar confirmados e possiveis falsos positivos.
- MySQL: local, nao exposto.
- Reset de senha: script local.
- HTTPS: obrigatorio via tunnel para acesso externo.
- Aviso MVP: mencionar apenas "em teste" e "sem backup".
- Core dumps: limpar e ignorar.

Decisoes futuras:

- Qual servico de tunnel gratuito sera usado na pratica.
- Qual proxy local sera usado: Caddy, Nginx ou outro.
- Se o operador tera permissao especial para testar Google Calendar enquanto convidados ficam bloqueados.
- Quando migrar para dominio proprio/Cloudflare Tunnel estavel.
- Se backup criptografado sera adotado depois.

## 16. Fase 3 executada - Evolucao futura

Estado: documentacao criada, sem implementacao de novas funcionalidades.

Decisao operacional: manter o MVP em usuario individual, cadastro por convite, administracao por scripts locais, reset por script local, Google Calendar desligado e sem backup.

Arquivo criado:

- `docs/security-roadmap.md`

Itens explicitamente adiados:

- multiusuario real com `households`, membership, roles e RBAC;
- admin UI;
- reset publico de senha;
- reativacao do Google Calendar para convidados;
- backup criptografado.

Motivo: todos esses itens aumentam a superficie de ataque e exigem novos contratos, novas permissoes e testes especificos. Para a primeira publicacao controlada, a abordagem mais segura e manter essas evolucoes como roadmap bloqueado por decisao futura.

Testes unitarios e de seguranca continuam planejados para o fechamento final do trabalho.

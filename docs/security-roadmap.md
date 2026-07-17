# Security Roadmap

Este documento registra a Fase 3 do plano de seguranca. A decisao atual e nao implementar estas evolucoes antes da primeira publicacao controlada para poucos amigos.

## Estado atual aprovado

- Modelo de acesso: usuario individual.
- Cadastro: fechado por convite de uso unico.
- Administracao: scripts locais.
- Reset de senha: script local.
- Google Calendar: desativado por flag.
- Backup: nao existe nesta fase; risco aceito.
- Publicacao: uma URL HTTPS de tunnel para proxy local unico.

## Evolucoes bloqueadas por decisao futura

### Multiusuario real

Pre-requisitos:

- Criar entidade `households`.
- Criar membership por usuario/casa.
- Adicionar roles por membership.
- Trocar filtros por `user.id` para filtros por `householdId` + permissao.
- Criar testes de IDOR entre casas e entre usuarios da mesma casa.

Risco se implementado cedo demais: quebra do isolamento de dados e aumento grande da superficie de autorizacao.

### Admin UI

Pre-requisitos:

- Modelo de role administrativo.
- Autenticacao reforcada para a conta operadora.
- Auditoria de acoes administrativas.
- Protecao contra CSRF e rate limit em endpoints admin.

Estado recomendado agora: manter apenas scripts locais.

### Reset publico de senha

Pre-requisitos:

- E-mail transacional confiavel.
- Tokens de reset de uso unico, hash no banco, expiracao curta.
- Mensagens genericas para evitar enumeracao.
- Rate limit por IP e e-mail.

Estado recomendado agora: manter reset por script local.

### Google Calendar para convidados

Pre-requisitos:

- Consentimento explicito na UI.
- Chave separada em `GOOGLE_TOKEN_ENCRYPTION_KEY`.
- Revisao de escopos OAuth.
- Testes de revogacao/desconexao.
- Validacao de callback e logs minimizados.

Estado recomendado agora: manter `GOOGLE_CALENDAR_ENABLED=false`.

### Backup criptografado

Pre-requisitos:

- Decisao do operador para aceitar backup.
- Criptografia local antes de sair da maquina.
- Retencao curta.
- Teste de restore.

Estado atual: sem backup, exibido como aviso no produto.

## Criterios para sair do MVP atual

- `npm run typecheck`, `npm run lint` e `npm run build` passando.
- Semgrep security/OWASP sem achados confirmados.
- Semgrep secrets sem achados.
- Dependencias altas resolvidas ou justificadas antes de exposicao maior.
- Testes unitarios e de seguranca cobrindo auth, convite, sessao, CSRF e IDOR.

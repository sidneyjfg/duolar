# DuoLar

MVP SaaS para casais organizarem tarefas domésticas, compras, finanças e carga mental.

## Stack

- Frontend: Next.js, React, TypeScript, TailwindCSS, Axios, TanStack Query, Zustand, React Hook Form, Zod, Framer Motion, Lucide React.
- Backend: Bun, Elysia, TypeScript, TypeORM, MySQL, JWT, Bcrypt, Dotenv, Class Validator.

## Rodando localmente

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
npm install
npm run dev:web

# Em outro terminal, com Bun instalado:
npm run dev:api
```

Frontend: `http://localhost:3000`

API: `http://localhost:4000/api`

O MySQL deve existir fora do container da API. Configure `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` e `DB_DATABASE` em `apps/api/.env`.

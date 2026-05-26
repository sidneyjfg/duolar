# DuoLar

MVP SaaS para casais organizarem tarefas domésticas, compras, finanças e carga mental.

## Stack

- Frontend: Next.js, React, TypeScript, TailwindCSS, Axios, TanStack Query, Zustand, React Hook Form, Zod, Framer Motion, Lucide React.
- Backend: Node.js, Express, TypeScript, TypeORM, MySQL, JWT, Bcrypt, Dotenv, Class Validator.

## Rodando localmente

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
docker compose up -d
npm install
npm run dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4000/api`

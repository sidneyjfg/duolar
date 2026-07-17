FROM oven/bun:1

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN bun install

WORKDIR /app/apps/api

COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src

ENV NODE_ENV=production
EXPOSE 4000

USER bun

CMD ["bun", "run", "start"]

# ---------- Build: frontend + backend ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend --no-audit --no-fund

COPY . .
RUN npm run build:all

# ---------- Runtime: um único resource/porta ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3333

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend --omit=dev --ignore-scripts --no-audit --no-fund

COPY --from=build /app/dist ./dist
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/prisma/schema.sql ./backend/prisma/schema.sql
COPY backend/scripts/db-deploy.js ./backend/scripts/db-deploy.js
COPY backend/scripts/demo-data.js ./backend/scripts/demo-data.js

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3333}/health" >/dev/null || exit 1

# O seed faz parte da subida: recria SOMENTE DB_SCHEMA, cria tabelas,
# insere os dados da rubrica e valida o cenário antes de iniciar a API.
CMD ["sh", "-c", "npm --prefix backend run db:deploy && npm --prefix backend run start"]

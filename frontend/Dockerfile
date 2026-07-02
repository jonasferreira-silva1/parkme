# =============================================================
# DOCKERFILE — ParkMe Frontend (Next.js)
# =============================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Instala o pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Variáveis de build — aponta para o serviço 'api' dentro da rede Docker
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_WS_URL=http://localhost:3000

RUN pnpm build

# --- Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3001

CMD ["pnpm", "start"]

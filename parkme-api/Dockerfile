# =============================================================
# DOCKERFILE — ParkMe API (NestJS)
# Multi-stage: build separado do runtime para imagem menor
# =============================================================

# --- Estágio 1: build ---
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

# --- Estágio 2: runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Build, Prisma client e schema
COPY --from=builder /app/dist                   ./dist
COPY --from=builder /app/node_modules/.prisma   ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma   ./node_modules/@prisma
COPY prisma ./prisma

# Script de seed para o entrypoint
COPY scripts/seed-docker.js ./scripts/seed-docker.js

# Entrypoint: migrations + seed automático + start
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

CMD ["sh", "entrypoint.sh"]

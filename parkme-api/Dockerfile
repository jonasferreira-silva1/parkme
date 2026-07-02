# =============================================================
# DOCKERFILE — ParkMe API (NestJS)
# =============================================================

# --- Estágio 1: build ---
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL é necessário para o Prisma no Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Gera o Prisma Client para Linux (dentro do container)
RUN npx prisma generate
RUN npm run build

# --- Estágio 2: runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copia o build e o cliente Prisma gerado para Linux
COPY --from=builder /app/dist                       ./dist
COPY --from=builder /app/node_modules/.prisma       ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma       ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]

#!/bin/sh
# =============================================================
# ENTRYPOINT — Inicialização da API em container Docker
#
# 1. Aplica migrations pendentes
# 2. Roda seed automático SE o banco estiver vazio
# 3. Inicia a aplicação NestJS
# =============================================================

set -e

echo "🚀 Iniciando ParkMe API..."

# 1. Migrations
echo "📦 Aplicando migrations..."
npx prisma migrate deploy

# 2. Seed automático se banco vazio
echo "🔍 Verificando dados no banco..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count()
  .then(n => { process.stdout.write(String(n)); return p.\$disconnect(); })
  .catch(() => { process.stdout.write('0'); });
" 2>/dev/null || echo "0")

echo "👥 Usuários encontrados: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
  echo "🌱 Banco vazio — executando seed..."
  node /app/scripts/seed-docker.js
else
  echo "✅ Banco já possui dados — seed ignorado"
fi

# 3. Inicia a API
echo "🟢 Iniciando servidor NestJS na porta 3000..."
exec node dist/src/main

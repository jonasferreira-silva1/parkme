# =============================================================
# SETUP.PS1 — Script de configuração completa do ParkMe
# Execute: .\setup.ps1
# Requer: Docker, Node.js >= 20, npm
# =============================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  🅿️  ParkMe — Setup Automático" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Verifica pré-requisitos ---
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

$nodeOk   = (node --version 2>$null) -match "v(2[0-9]|[3-9][0-9])"
$dockerOk = (docker --version 2>$null) -match "Docker"

if (-not $nodeOk) {
    Write-Host "  ❌ Node.js >= 20 não encontrado. Instale em: https://nodejs.org" -ForegroundColor Red
    exit 1
}
if (-not $dockerOk) {
    Write-Host "  ❌ Docker não encontrado. Instale em: https://docker.com" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Node.js: $(node --version)" -ForegroundColor Green
Write-Host "  ✅ Docker disponível" -ForegroundColor Green

# --- 2. Sobe containers ---
Write-Host ""
Write-Host "🐳 Subindo containers (PostgreSQL + Redis)..." -ForegroundColor Yellow
Set-Location parkme-api
docker-compose up -d

Write-Host "  ⏳ Aguardando banco ficar pronto (10s)..."
Start-Sleep -Seconds 10

# --- 3. Instala dependências do backend ---
Write-Host ""
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
npm install --legacy-peer-deps

# --- 4. Gera Prisma Client ---
Write-Host ""
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Yellow
node_modules\.bin\prisma generate

# --- 5. Migrations ---
Write-Host ""
Write-Host "🗄️  Aplicando migrations..." -ForegroundColor Yellow
node_modules\.bin\prisma migrate dev --name init

# --- 6. Seed ---
Write-Host ""
Write-Host "🌱 Populando banco com dados iniciais..." -ForegroundColor Yellow
npx ts-node prisma/seed.ts

# --- 7. Testes ---
Write-Host ""
Write-Host "🧪 Rodando testes..." -ForegroundColor Yellow
npx jest --no-coverage 2>&1 | Select-Object -Last 5

Set-Location ..

# --- Resumo final ---
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  ✅ Setup concluído!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Para iniciar o backend:" -ForegroundColor White
Write-Host "    cd parkme-api && npm run start:dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  API:     http://localhost:3000" -ForegroundColor White
Write-Host "  Swagger: http://localhost:3000/api" -ForegroundColor White
Write-Host "  Redis:   http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "  Para iniciar o app mobile:" -ForegroundColor White
Write-Host "    cd parkme-mobile && npm install && npx expo start" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Credenciais de teste (senha: Senha@123):" -ForegroundColor White
Write-Host "    joao@parkme.com     (Motorista)" -ForegroundColor Gray
Write-Host "    operador@parkme.com (Operador)" -ForegroundColor Gray
Write-Host "    admin@parkme.com    (Admin)" -ForegroundColor Gray
Write-Host ""

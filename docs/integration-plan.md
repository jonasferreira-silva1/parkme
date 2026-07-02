# Plano de Integração — Frontend Web × API ParkMe

> **Objetivo:** conectar o dashboard Next.js (`/frontend`) à API NestJS (`/parkme-api`) em 4 partes incrementais, cada uma com commit dedicado no GitHub.

---

## Visão Geral do Stack

| Camada | Tecnologia | Porta |
|---|---|---|
| Frontend web | Next.js 16 + Tailwind + shadcn/ui | 3001 |
| API backend | NestJS + Prisma | 3000 |
| Banco de dados | PostgreSQL | 5432 |
| Cache / filas | Redis | 6379 |
| Real-time | Socket.io `/parking` | 3000 (WS) |

---

## Estado atual do frontend (antes da integração)

Todos os componentes existem e têm visual completo, mas usam **dados hardcoded/simulados**:

- `lib/parkme-data.ts` — fonte de todos os dados mock
- `KpiCards` — valores fixos no código
- `SpotMap` — vagas geradas por semente determinística + `setInterval` simulando WebSocket
- `LiveFeed` — eventos gerados localmente a cada 3,2s
- `ActiveSessions` — array fixo de 6 sessões
- `OccupancyChart`, `RevenueChart`, `FloorOccupancy` — arrays hardcoded
- Sidebar/Topbar — usuário "Carlos Operador" fixo no código

---

## Parte 1 — Fundação: configuração + autenticação

**Branch:** `feat/frontend-part1-auth`
**Commit:** `feat(frontend): fundação — cliente HTTP, autenticação e rota de login`

### O que fazer

- [ ] Instalar dependências: `axios`, `socket.io-client`, `js-cookie`, `@types/js-cookie`
- [ ] Criar `frontend/lib/api.ts` — cliente Axios com:
  - `baseURL` apontando para `http://localhost:3000`
  - interceptor de request: injeta `Authorization: Bearer <token>`
  - interceptor de response: renova token automaticamente em 401 via `/auth/refresh`
- [ ] Criar `frontend/lib/auth.ts` — funções `login()`, `logout()`, `getUser()`, `getToken()`
  - armazena tokens em `localStorage` (access) e cookie httpOnly não é possível no client-side Next.js sem server action — usa localStorage mesmo
- [ ] Criar `frontend/app/(auth)/login/page.tsx` — formulário de login
  - campos: e-mail, senha
  - chama `POST /auth/login`
  - redireciona para `/` após sucesso
  - exibe erro de credenciais inválidas
- [ ] Criar `frontend/middleware.ts` — protege todas as rotas exceto `/login`
  - verifica token no cookie/localStorage via `request.cookies`
  - redireciona para `/login` se não autenticado
- [ ] Atualizar `Sidebar` — nome e role do usuário vindos do store de auth
- [ ] Atualizar `Topbar` — nome do usuário e estacionamento vindos da API

### Resultado esperado
> Frontend roda em `localhost:3001`, operador faz login com `operador@parkme.com / Senha@123`, dashboard abre autenticado com dados do usuário real.

---

## Parte 2 — KPIs e Analytics: gráficos com dados reais

**Branch:** `feat/frontend-part2-analytics`
**Commit:** `feat(frontend): analytics — KPIs, gráficos e ocupação por andar com dados reais`

### O que fazer

- [ ] Criar `frontend/lib/hooks/useAnalytics.ts` — hook que busca:
  - `GET /analytics/occupancy` → taxa de ocupação, vagas livres/ocupadas por andar
  - `GET /analytics/revenue` → receita do dia e da semana
  - `GET /analytics/avg-duration` → duração média das sessões
- [ ] Atualizar `KpiCards` — substituir valores hardcoded pelos vindos da API:
  - Ocupação atual → `occupancy.taxaOcupacao`
  - Sessões ativas → `occupancy.ocupadas`
  - Faturamento hoje → `revenue.totalReceita`
  - Permanência média → `avgDuration.mediaFormatada`
- [ ] Atualizar `OccupancyChart` — buscar dados reais de ocupação por hora (ou adaptar com os dados disponíveis)
- [ ] Atualizar `RevenueChart` — buscar receita da semana por método de pagamento
- [ ] Atualizar `FloorOccupancy` — substituir pelo `occupancy.porAndar` da API
- [ ] Atualizar `SpotMixChart` — buscar contagem real de vagas por tipo (`GET /spots`)
- [ ] Adicionar loading states (skeleton) em todos os cards

### Resultado esperado
> Os 4 KPI cards e todos os gráficos mostram dados reais do banco. Operador vê números corretos de ocupação e faturamento.

---

## Parte 3 — Mapa e Sessões: tempo real

**Branch:** `feat/frontend-part3-realtime`
**Commit:** `feat(frontend): tempo real — mapa de vagas via WebSocket e sessões ativas da API`

### O que fazer

- [ ] Criar `frontend/lib/socket.ts` — cliente Socket.io singleton (igual ao mobile):
  - conecta em `http://localhost:3000/parking`
  - envia JWT no handshake `auth: { token }`
  - emite `entrar_estacionamento` com o `lotId`
- [ ] Criar `frontend/lib/hooks/useSpots.ts` — hook que:
  - busca vagas iniciais via `GET /spots?lotId=`
  - escuta `vaga_ocupada` e `vaga_livre` do WebSocket para atualização incremental
- [ ] Atualizar `SpotMap` — substituir `buildSpots()` + `setInterval` pelo hook `useSpots`
- [ ] Criar `frontend/lib/hooks/useSessions.ts` — busca `GET /sessions/active` e sessões completadas
- [ ] Atualizar `ActiveSessions` — dados reais da API com auto-refresh a cada 30s
- [ ] Atualizar `LiveFeed` — substituir `setInterval` local pela escuta real do WebSocket:
  - `vaga_ocupada` / `vaga_livre` / `sessao_expirando` / `ocupacao_geral`
- [ ] Fazer o botão **"Registrar entrada"** da Topbar funcional:
  - abre modal com lista de veículos cadastrados
  - chama `POST /sessions/entry`
  - atualiza o mapa ao confirmar

### Resultado esperado
> Mapa reflete o banco em tempo real. Ao registrar entrada pelo dashboard, a vaga muda de verde para vermelho instantaneamente no mapa e no app mobile.

---

## Parte 4 — Páginas internas: sessões, pagamentos e vagas

**Branch:** `feat/frontend-part4-pages`
**Commit:** `feat(frontend): páginas internas — sessões, pagamentos, vagas e navegação completa`

### O que fazer

- [ ] Tornar a navegação da `Sidebar` funcional com `next/link` / `useRouter`
- [ ] Criar `frontend/app/(dashboard)/sessions/page.tsx`:
  - tabela paginada com `GET /sessions/history`
  - filtros por data e status
  - botão de registrar saída manual (`POST /sessions/:id/exit`)
- [ ] Criar `frontend/app/(dashboard)/payments/page.tsx`:
  - listagem de pagamentos com status (PENDING / APPROVED / FAILED)
  - botão `[DEV] Confirmar` chama `POST /payments/:id/confirm-dev`
- [ ] Criar `frontend/app/(dashboard)/spots/page.tsx`:
  - grid completo de vagas com controle manual de status
  - `PATCH /spots/:id/status` para operadores
- [ ] Botão "Ver histórico" em `ActiveSessions` navega para `/sessions`
- [ ] Adicionar badge de notificações no sino da Topbar usando `GET /notifications`
- [ ] Criar `frontend/app/(dashboard)/analytics/page.tsx` — página dedicada de analytics

### Resultado esperado
> Dashboard totalmente funcional. Operador consegue gerenciar sessões, acompanhar pagamentos, controlar vagas manualmente e ver analytics completos.

---

## Fluxo de commits no GitHub

```
main
 └── feat/frontend-part1-auth        → PR → merge → tag v1.1.0
      └── feat/frontend-part2-analytics → PR → merge → tag v1.2.0
           └── feat/frontend-part3-realtime → PR → merge → tag v1.3.0
                └── feat/frontend-part4-pages → PR → merge → tag v1.4.0
```

Cada parte:
1. Cria a branch a partir de `main`
2. Implementa as mudanças
3. Commit com mensagem semântica (`feat`, `fix`, `refactor`)
4. Push e merge em `main`

---

## Como rodar localmente após a integração

```bash
# 1. Subir a infraestrutura
cd parkme-api
docker-compose up -d          # PostgreSQL + Redis

# 2. Rodar a API
npm run start:dev             # http://localhost:3000

# 3. Rodar o frontend
cd ../frontend
pnpm install
pnpm dev                      # http://localhost:3001
```

---

## Variáveis de ambiente do frontend

Criar `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

---

## Mapeamento de endpoints por componente

| Componente | Método | Endpoint |
|---|---|---|
| `KpiCards` — Ocupação | GET | `/analytics/occupancy` |
| `KpiCards` — Faturamento | GET | `/analytics/revenue` |
| `KpiCards` — Permanência | GET | `/analytics/avg-duration` |
| `SpotMap` | GET + WS | `/spots?lotId=` + `vaga_ocupada/livre` |
| `ActiveSessions` | GET | `/sessions/active` (por lotId) |
| `LiveFeed` | WS | `vaga_ocupada`, `vaga_livre`, `sessao_expirando` |
| `FloorOccupancy` | GET | `/analytics/occupancy` |
| `RevenueChart` | GET | `/analytics/revenue?from=&to=` |
| `SpotMixChart` | GET | `/spots?lotId=` |
| `Topbar` — usuário | GET | `/auth/me` |
| `Topbar` — notificações | GET | `/notifications` |

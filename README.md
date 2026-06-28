# 🅿️ ParkMe — Sistema Inteligente de Estacionamento

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

> **"Você já esqueceu onde deixou seu carro num shopping?"**
> O ParkMe resolve isso. Assim que você estaciona, recebe no celular o mapa com a sua vaga destacada e uma rota para encontrá-la quando voltar.

---

## 📁 Estrutura do Projeto

```
Sis-estac/
├── parkme-api/          ← Backend NestJS (API REST + WebSocket)
├── parkme-mobile/       ← App React Native + Expo
├── docs/
│   └── index.html       ← Documentação interativa (abrir no navegador)
├── setup.ps1            ← Script de setup automático (Windows)
└── README.md
```

---

## ⚡ Início Rápido

### Pré-requisitos
- **Docker Desktop** — [docker.com](https://docker.com)
- **Node.js >= 20** — [nodejs.org](https://nodejs.org)
- **Expo Go** no celular — [expo.dev/go](https://expo.dev/go)

### Setup automático (Windows)
```powershell
# Na raiz do projeto
.\setup.ps1
```

### Setup manual (passo a passo)

#### 1. Subir banco de dados e Redis
```bash
cd parkme-api
docker-compose up -d
```

#### 2. Instalar dependências do backend
```bash
npm install --legacy-peer-deps
```

#### 3. Gerar o Prisma Client
```bash
npx prisma generate
```

#### 4. Criar as tabelas no banco
```bash
npx prisma migrate dev --name init
```

#### 5. Popular o banco com dados iniciais
```bash
npx ts-node prisma/seed.ts
```

#### 6. Iniciar o backend
```bash
npm run start:dev
```

✅ API disponível em: **http://localhost:3000**
📖 Swagger UI em: **http://localhost:3000/api**
🔌 WebSocket em: **ws://localhost:3000/parking**

#### 7. Iniciar o app mobile
```bash
cd ../parkme-mobile
npm install
npx expo start
```
Escaneie o QR code com o app **Expo Go** no celular.

> **Celular físico?** Abra `parkme-mobile/services/api.ts` e troque `10.0.2.2` pelo IP local da sua máquina (ex: `192.168.1.100`).

---

## 🔑 Credenciais de Teste

| Usuário | E-mail | Senha | Perfil |
|---------|--------|-------|--------|
| João Silva | `joao@parkme.com` | `Senha@123` | Motorista |
| Maria Oliveira | `maria@parkme.com` | `Senha@123` | Motorista PCD |
| Carlos Operador | `operador@parkme.com` | `Senha@123` | Operador |
| Admin Sistema | `admin@parkme.com` | `Senha@123` | Admin |

---

## 🧪 Rodando os Testes

```bash
cd parkme-api

# Todos os testes
npm run test

# Com relatório de cobertura
npm run test:cov

# Somente testes de tarifa (property-based)
npx jest fare.utils.spec --no-coverage
```

Resultado esperado: **17 testes passando** (unitários + property-based com fast-check)

---

## 📡 Principais Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login → retorna JWT |
| GET | `/spots?lotId=` | Listar todas as vagas |
| GET | `/spots/available` | Vagas livres |
| POST | `/sessions/entry` | Registrar entrada → atribui vaga |
| POST | `/sessions/:id/exit` | Registrar saída → calcula tarifa |
| GET | `/sessions/active` | Sessão ativa do usuário |
| GET | `/sessions/history` | Histórico paginado |
| POST | `/payments/:sessionId` | Criar pagamento (Pix/cartão) |
| POST | `/payments/:id/confirm-dev` | Confirmar pagamento (só DEV) |
| GET | `/analytics/occupancy` | Ocupação atual por andar |

---

## 🔌 WebSocket Events

Conecte em `ws://localhost:3000/parking`

```js
// Entrar na sala do estacionamento
socket.emit('entrar_estacionamento', { lotId: 'xxx' })

// Ouvir mudanças de vagas
socket.on('vaga_ocupada', (data) => { /* { spotId, floor, sector, number } */ })
socket.on('vaga_livre',   (data) => { /* { spotId, floor, sector, number } */ })

// Alerta de sessão expirando (sala privada do usuário)
socket.emit('entrar_sala_usuario', { userId: 'xxx' })
socket.on('sessao_expirando', (data) => { /* { sessionId, minutesLeft, totalAmount } */ })
```

---

## 🏗️ Arquitetura

```
App Mobile (React Native + Expo)
        │
        │  HTTP/REST + WebSocket
        ▼
API NestJS (porta 3000)
  ├── Auth Module      → JWT + Passport + bcrypt
  ├── Spots Module     → Vagas + algoritmo de atribuição
  ├── Sessions Module  → Entrada/saída + cálculo de tarifa
  ├── Payments Module  → MercadoPago + webhook
  ├── Analytics Module → Métricas para admin/operador
  ├── Vehicles Module  → CRUD de veículos
  └── Parking Gateway  → WebSocket real-time
        │
        ├── PostgreSQL (porta 5432) — dados permanentes
        └── Redis (porta 6379)      — cache + filas BullMQ
```

---

## 💡 Decisões Técnicas

**Por que Prisma v5 e não v7?**
O Prisma v7 mudou significativamente a configuração de datasource, quebrando compatibilidade com a sintaxe do schema. Usamos v5.22.0 por ser a versão LTS mais estável com ampla documentação.

**Por que Zustand e não Redux?**
Zustand tem API mais simples, menos boilerplate e performance equivalente para este escopo. A loja é dividida em 3 slices (auth, parking, session) seguindo o princípio de responsabilidade única.

**Por que BFS e não A*?**
O grid de vagas é pequeno (≤ 120 células por andar) e não tem pesos nas arestas. BFS é ótimo para este caso — encontra o menor caminho em grafos não ponderados e é mais simples de manter.

---

## 📄 Licença

MIT © 2025 ParkMe

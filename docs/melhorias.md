# Plano de Implementação — Auditoria e Refatoração ParkMe

Este plano detalha os resultados da auditoria de código realizada no backend (`parkme-api`) e no aplicativo mobile (`parkme-mobile`), cobrindo código morto, segurança, boas práticas e testes.

## User Review Required

> [!WARNING]
> **Vulnerabilidade Crítica no Endpoint `/confirm-dev`**
> O endpoint `POST /payments/:id/confirm-dev` permite a confirmação manual de pagamentos (liberação de vagas) por qualquer usuário autenticado. Ele **não** está protegido pela verificação de ambiente (`NODE_ENV !== 'production'`), expondo um risco severo de fraude em produção. 
> *Ação proposta:* Adicionar verificação explícita do ambiente `NODE_ENV` lançando `ForbiddenException` em caso de ambiente diferente de desenvolvimento.

> [!WARNING]
> **Vulnerabilidade no Canal de WebSocket (`ParkingGateway`)**
> O evento `@SubscribeMessage('entrar_sala_usuario')` aceita um `userId` livremente fornecido pelo cliente para inscrevê-lo na sala privada do usuário. Isso permite que qualquer cliente conectado se inscreva na sala de outro usuário e espione seus alertas de expiração e dados de pagamento.
> *Ação proposta:* Validar o token JWT durante o aperto de mão (handshake) do WebSocket e usar o `userId` decodificado do token para ingressar nas salas privadas, impedindo spoofing.

## Open Questions

> [!IMPORTANT]
> **Consistência de Nomenclatura**
> O backend e o mobile utilizam inglês nas rotas HTTP e nos modelos do banco de dados (ex: `spots`, `sessions`, `payments`), mas os eventos de WebSocket e mensagens internas estão em português (ex: `vaga_ocupada`, `entrar_estacionamento`).
> *Pergunta:* Devemos manter essa mistura (que reflete o estado atual documentado no README e integrado ao mobile) ou planejar uma tradução uniforme dos nomes dos eventos WebSocket para inglês em uma etapa futura?
> *Recomendação:* Manter por ora para evitar quebras, mas sinalizar com `TODO` explicativo.

> [!IMPORTANT]
> **Fila BullMQ Ausente**
> O README e os comentários nos arquivos referenciam a utilização do **BullMQ** para enfileiramento e expiração de sessões (ex: `parking.gateway.ts` linha 110). Contudo, o `package.json` da API não possui as dependências do BullMQ e não há implementação de Workers ou Queues de fato.
> *Pergunta:* Devemos manter os comentários que descrevem a arquitetura futura ou marcá-los com um `TODO` para implementação posterior?

---

## Proposed Changes

### Componente: Backend (parkme-api)

#### [MODIFY] [vehicles.service.ts](file:///c:/DEV/Sis-estac/parkme-api/src/vehicles/vehicles.service.ts)
- Remover o import não utilizado de `ForbiddenException` na linha 8 (corrige a falha de lint).

#### [MODIFY] [payments.controller.ts](file:///c:/DEV/Sis-estac/parkme-api/src/payments/payments.controller.ts)
- Adicionar verificação no método `confirmarDev` para garantir que só execute se `process.env.NODE_ENV !== 'production'`. Caso contrário, lançar um `ForbiddenException`.

#### [MODIFY] [parking.gateway.ts](file:///c:/DEV/Sis-estac/parkme-api/src/gateways/parking.gateway.ts)
- Adicionar validação de token JWT no handshake da conexão para obter o `userId` autenticado.
- Alterar `@SubscribeMessage('entrar_sala_usuario')` para usar o ID do usuário decodificado do token JWT anexado à conexão do socket (`client.handshake.auth.token`) em vez de confiar no `userId` passado no corpo da mensagem.

#### [MODIFY] [main.ts](file:///c:/DEV/Sis-estac/parkme-api/src/main.ts)
- Refatorar o CORS para não liberar `*` incondicionalmente em produção. Configurar para ler uma variável `ALLOWED_ORIGINS` e usar `*` apenas em desenvolvimento.

#### [MODIFY] [schema.prisma](file:///c:/DEV/Sis-estac/parkme-api/prisma/schema.prisma)
- Adicionar índices no modelo `Session`:
  - `@@index([vehicleId, status])`
  - `@@index([status])`
- Adicionar índices no modelo `Vehicle`:
  - `@@index([userId])`
- Adicionar índices no modelo `Notification`:
  - `@@index([userId])`

#### [MODIFY] [.env.example](file:///c:/DEV/Sis-estac/parkme-api/.env.example)
- Adicionar `ALLOWED_ORIGINS` como exemplo.

---

### Componente: Mobile (parkme-mobile)

#### [MODIFY] [package.json](file:///c:/DEV/Sis-estac/parkme-mobile/package.json)
- Remover dependência não utilizada `@react-native-async-storage/async-storage`.
- Remover dependência não utilizada `expo-location`.
- Remover dependência não utilizada `expo-notifications`.

#### [NEW] [.env.example](file:///c:/DEV/Sis-estac/parkme-mobile/.env.example)
- Criar arquivo contendo a configuração recomendada:
  ```env
  EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
  ```

#### [MODIFY] [api.ts](file:///c:/DEV/Sis-estac/parkme-mobile/services/api.ts)
- Alterar a definição de `API_URL` para utilizar `process.env.EXPO_PUBLIC_API_URL` com fallback para `'http://10.0.2.2:3000'` em desenvolvimento.

#### [MODIFY] [socket.ts](file:///c:/DEV/Sis-estac/parkme-mobile/services/socket.ts)
- Alterar a definição de `SOCKET_URL` para utilizar `process.env.EXPO_PUBLIC_API_URL` (mesma variável) com fallback correspondente.

---

### Componente: Documentação (docs)

#### [MODIFY] [README.md](file:///c:/DEV/Sis-estac/README.md)
- Atualizar a árvore de diretórios na seção **Estrutura do Projeto** para listar a pasta `/frontend` que está presente no repositório mas omitida no README.

---

## Verification Plan

### Automated Tests
- Rodar a suíte de testes existente do backend para garantir que não haja regressão:
  ```bash
  cd parkme-api
  npm run test
  ```
- Executar o linter para atestar que os erros de variáveis não utilizadas no NestJS foram sanados:
  ```bash
  npm run lint
  ```

### Manual Verification
- Testar a chamada do endpoint `POST /payments/:id/confirm-dev` com `NODE_ENV=production` e comprovar que retorna erro `403 Forbidden`.
- Validar que o aplicativo móvel continua conectando ao WebSocket e atualizando o mapa de vagas após a introdução da autenticação no socket.
- Validar se o build do app mobile (`parkme-mobile`) é concluído com sucesso após a remoção das dependências mortas do `package.json`.

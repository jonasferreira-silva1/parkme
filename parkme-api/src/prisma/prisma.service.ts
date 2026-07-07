// =============================================================
// PRISMA SERVICE — Conexão com o banco de dados
// Este serviço é usado por todos os outros módulos para
// acessar o banco. É um singleton (uma única instância).
// =============================================================

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Logger do NestJS para exibir mensagens no console com contexto
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Nível de log: mostra queries, erros e avisos no ambiente de dev
      log:
        process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  // Conecta ao banco quando o módulo NestJS é iniciado
  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Conectado ao banco de dados PostgreSQL');
  }

  // Desconecta do banco quando o módulo NestJS é encerrado
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Desconectado do banco de dados');
  }
}

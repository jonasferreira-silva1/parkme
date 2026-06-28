// =============================================================
// PRISMA MODULE — Torna o PrismaService disponível globalmente
// Com @Global(), qualquer módulo pode injetar o PrismaService
// sem precisar importar o PrismaModule explicitamente.
// =============================================================

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Disponível em toda a aplicação sem reimportar
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporta para outros módulos usarem
})
export class PrismaModule {}

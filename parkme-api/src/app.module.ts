// =============================================================
// APP MODULE — Módulo raiz da aplicação
// Aqui todos os módulos são registrados e conectados.
// O NestJS usa esse arquivo como ponto de entrada da DI container.
// =============================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Módulos internos da aplicação
import { PrismaModule }         from './prisma/prisma.module';
import { AuthModule }           from './auth/auth.module';
import { SpotsModule }          from './spots/spots.module';
import { SessionsModule }       from './sessions/sessions.module';
import { PaymentsModule }       from './payments/payments.module';
import { VehiclesModule }       from './vehicles/vehicles.module';
import { AnalyticsModule }      from './analytics/analytics.module';
import { GatewaysModule }       from './gateways/gateways.module';
import { NotificationsModule }  from './notifications/notifications.module';

@Module({
  imports: [
    // Carrega as variáveis do arquivo .env globalmente
    // isGlobal: true → disponível em qualquer módulo sem reimportar
    ConfigModule.forRoot({ isGlobal: true }),

    // Banco de dados — disponível globalmente via @Global()
    PrismaModule,

    // Funcionalidades da aplicação
    AuthModule,
    SpotsModule,
    SessionsModule,
    PaymentsModule,
    VehiclesModule,
    AnalyticsModule,
    GatewaysModule,
    NotificationsModule,
  ],
})
export class AppModule {}

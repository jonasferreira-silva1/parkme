// =============================================================
// MAIN.TS — Ponto de entrada da aplicação NestJS
// Configura: CORS, validação global, Swagger, WebSocket
// =============================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Suprime logs excessivos de inicialização em produção
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['log', 'error', 'warn', 'debug'],
  });

  // -----------------------------------------------------------
  // CORS — Permite que o app mobile e o navegador se comuniquem
  // Em produção, restringe para as origens permitidas via ALLOWED_ORIGINS
  // -----------------------------------------------------------
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*';

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // -----------------------------------------------------------
  // VALIDAÇÃO GLOBAL — Aplica os DTOs com class-validator
  // whitelist: true → ignora campos não declarados no DTO
  // forbidNonWhitelisted: true → retorna erro se enviar campo extra
  // transform: true → converte os tipos automaticamente (string → number)
  // -----------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // -----------------------------------------------------------
  // SWAGGER — Documentação interativa da API
  // Acesse em: http://localhost:3000/api
  // -----------------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('ParkMe API')
    .setDescription(
      '🅿️ Sistema Inteligente de Estacionamento — API REST + WebSocket\n\n' +
        'Use o botão "Authorize" para inserir o JWT token após fazer login.',
    )
    .setVersion('1.0.0')
    .addBearerAuth() // Adiciona campo para inserir o JWT no Swagger UI
    .addTag('Auth', 'Registro, login e renovação de tokens')
    .addTag('Vagas', 'Gerenciamento de vagas do estacionamento')
    .addTag('Sessões', 'Entrada e saída de veículos')
    .addTag('Pagamentos', 'Pagamentos via MercadoPago')
    .addTag('Veículos', 'Gerenciamento de veículos do usuário')
    .addTag('Analytics', 'Métricas e relatórios (Operador/Admin)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      // Persiste o token JWT entre recargas da página
      persistAuthorization: true,
      // Expande apenas a primeira seção por padrão
      docExpansion: 'list',
    },
  });

  // -----------------------------------------------------------
  // Inicia o servidor
  // -----------------------------------------------------------
  const porta = process.env.PORT ?? 3000;
  await app.listen(porta);

  logger.log(`🚀 ParkMe API rodando em: http://localhost:${porta}`);
  logger.log(`📖 Swagger UI em:         http://localhost:${porta}/api`);
  logger.log(`🔌 WebSocket em:          ws://localhost:${porta}/parking`);
}

bootstrap();

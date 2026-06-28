// =============================================================
// SESSIONS CONTROLLER — Rotas para entrada e saída de veículos
// =============================================================

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { EntryDto } from './dto/entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sessões')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // POST /sessions/entry — Registra entrada e atribui vaga
  @Post('entry')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar entrada do veículo — atribui vaga automaticamente' })
  async entry(
    @Body() dto: EntryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.registrarEntrada(dto, userId);
  }

  // GET /sessions/active — Sessão ativa do usuário logado
  @Get('active')
  @ApiOperation({ summary: 'Obter sessão ativa do usuário' })
  async active(@CurrentUser('id') userId: string) {
    return this.sessionsService.buscarSessaoAtiva(userId);
  }

  // GET /sessions/history — Histórico de sessões
  @Get('history')
  @ApiOperation({ summary: 'Histórico de sessões do usuário (paginado)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async history(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionsService.buscarHistorico(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  // POST /sessions/:id/exit — Registra saída e calcula valor
  @Post(':id/exit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar saída — calcula tarifa' })
  async exit(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sessionsService.registrarSaida(sessionId, userId);
  }
}

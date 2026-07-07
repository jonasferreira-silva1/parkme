// =============================================================
// ANALYTICS CONTROLLER — Rotas de métricas (Admin/Operador)
// =============================================================

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATOR', 'ADMIN') // Apenas operadores e admins
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // GET /analytics/occupancy — Ocupação atual
  @Get('occupancy')
  @ApiOperation({ summary: 'Taxa de ocupação atual por andar' })
  @ApiQuery({ name: 'lotId', required: false })
  ocupacao(@Query('lotId') lotId?: string) {
    return this.analyticsService.ocupacao(lotId);
  }

  // GET /analytics/revenue — Receita por período
  @Get('revenue')
  @ApiOperation({ summary: 'Receita total por período' })
  @ApiQuery({ name: 'from', required: false, example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2025-12-31' })
  receita(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.receita(from, to);
  }

  // GET /analytics/avg-duration — Duração média das sessões
  @Get('avg-duration')
  @ApiOperation({ summary: 'Duração média das sessões' })
  @ApiQuery({ name: 'lotId', required: false })
  duracaoMedia(@Query('lotId') lotId?: string) {
    return this.analyticsService.duracaoMedia(lotId);
  }
}

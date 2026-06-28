// =============================================================
// SPOTS CONTROLLER — Rotas para gerenciamento de vagas
// =============================================================

import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SpotsService } from './spots.service';
import { UpdateSpotStatusDto } from './dto/update-spot-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Vagas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Todas as rotas exigem autenticação
@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  // GET /spots — Lista todas as vagas (com filtros opcionais)
  @Get()
  @ApiOperation({ summary: 'Listar todas as vagas' })
  @ApiQuery({ name: 'lotId', required: false, description: 'Filtrar por estacionamento' })
  @ApiQuery({ name: 'floor', required: false, description: 'Filtrar por andar' })
  async findAll(
    @Query('lotId') lotId?: string,
    @Query('floor') floor?: string,
  ) {
    return this.spotsService.findAll(lotId, floor ? parseInt(floor) : undefined);
  }

  // GET /spots/available — Lista só vagas livres
  @Get('available')
  @ApiOperation({ summary: 'Listar vagas disponíveis' })
  @ApiQuery({ name: 'lotId', required: false })
  @ApiQuery({ name: 'floor', required: false })
  async findAvailable(
    @Query('lotId') lotId?: string,
    @Query('floor') floor?: string,
  ) {
    return this.spotsService.findAvailable(lotId, floor ? parseInt(floor) : undefined);
  }

  // GET /spots/:id — Detalhe de uma vaga
  @Get(':id')
  @ApiOperation({ summary: 'Buscar vaga por ID' })
  async findOne(@Param('id') id: string) {
    return this.spotsService.findOne(id);
  }

  // PATCH /spots/:id/status — Atualiza status (operador ou admin)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('OPERATOR', 'ADMIN') // Apenas operadores e admins podem alterar manualmente
  @ApiOperation({ summary: 'Atualizar status da vaga (Operador/Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSpotStatusDto,
  ) {
    return this.spotsService.updateStatus(id, dto);
  }
}

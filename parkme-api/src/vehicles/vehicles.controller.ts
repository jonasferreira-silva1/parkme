// =============================================================
// VEHICLES CONTROLLER — Rotas para gerenciar veículos
// =============================================================

import {
  Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Veículos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar meus veículos' })
  findAll(@CurrentUser('id') userId: string) {
    return this.vehiclesService.findAll(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar novo veículo' })
  create(@Body() dto: CreateVehicleDto, @CurrentUser('id') userId: string) {
    return this.vehiclesService.create(dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover veículo' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vehiclesService.remove(id, userId);
  }
}

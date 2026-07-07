// =============================================================
// VEHICLES SERVICE — CRUD de veículos do usuário
// =============================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista todos os veículos do usuário autenticado
  async findAll(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Cadastra um novo veículo para o usuário
  async create(dto: CreateVehicleDto, userId: string) {
    // Placa deve ser única em todo o sistema
    const placaExistente = await this.prisma.vehicle.findUnique({
      where: { plate: dto.plate.toUpperCase() },
    });

    if (placaExistente) {
      throw new ConflictException('Esta placa já está cadastrada no sistema');
    }

    return this.prisma.vehicle.create({
      data: {
        userId,
        plate: dto.plate.toUpperCase(), // Sempre salva em maiúsculas
        brand: dto.brand,
        model: dto.model,
        color: dto.color,
      },
    });
  }

  // Remove um veículo (só se não tiver sessão ativa)
  async remove(id: string, userId: string) {
    const veiculo = await this.prisma.vehicle.findFirst({
      where: { id, userId },
    });

    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    // Impede remoção se houver sessão ativa
    const sessaoAtiva = await this.prisma.session.findFirst({
      where: { vehicleId: id, status: 'ACTIVE' },
    });

    if (sessaoAtiva) {
      throw new BadRequestException(
        'Não é possível remover um veículo com sessão ativa',
      );
    }

    await this.prisma.vehicle.delete({ where: { id } });
    return { message: 'Veículo removido com sucesso' };
  }
}

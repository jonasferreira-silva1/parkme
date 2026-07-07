// =============================================================
// SPOTS SERVICE — Lógica de negócio das vagas
// Responsabilidades: listar, filtrar e atualizar vagas.
// O algoritmo de atribuição automática também fica aqui.
// =============================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { SpotStatus, SpotType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSpotStatusDto } from './dto/update-spot-status.dto';

@Injectable()
export class SpotsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------
  // Lista todas as vagas de um estacionamento
  // -----------------------------------------------------------
  async findAll(lotId?: string, andar?: number) {
    return this.prisma.spot.findMany({
      where: {
        // Filtra por estacionamento se informado
        ...(lotId && { lotId }),
        // Filtra por andar se informado
        ...(andar && { floor: andar }),
      },
      orderBy: [
        { floor: 'asc' }, // Ordena por andar primeiro
        { sector: 'asc' }, // Depois por setor
        { number: 'asc' }, // Depois por número
      ],
    });
  }

  // -----------------------------------------------------------
  // Busca uma vaga específica pelo ID
  // -----------------------------------------------------------
  async findOne(id: string) {
    const vaga = await this.prisma.spot.findUnique({
      where: { id },
      include: {
        lot: { select: { name: true, pricePerHour: true } },
      },
    });

    if (!vaga) {
      throw new NotFoundException(`Vaga #${id} não encontrada`);
    }

    return vaga;
  }

  // -----------------------------------------------------------
  // Lista apenas as vagas disponíveis (status FREE)
  // -----------------------------------------------------------
  async findAvailable(lotId?: string, andar?: number) {
    return this.prisma.spot.findMany({
      where: {
        status: SpotStatus.FREE,
        ...(lotId && { lotId }),
        ...(andar && { floor: andar }),
      },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    });
  }

  // -----------------------------------------------------------
  // Atualiza o status de uma vaga manualmente (operador/admin)
  // -----------------------------------------------------------
  async updateStatus(id: string, dto: UpdateSpotStatusDto) {
    // Verifica se a vaga existe antes de atualizar
    await this.findOne(id);

    return this.prisma.spot.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // -----------------------------------------------------------
  // ALGORITMO DE ATRIBUIÇÃO AUTOMÁTICA DE VAGA
  // Regras (em ordem de prioridade):
  //   1. PCD: vagas DISABLED primeiro (se usuário for PCD)
  //   2. VIP: vagas VIP primeiro (se usuário for VIP)
  //   3. Padrão: primeira STANDARD livre, andar 1 primeiro
  // -----------------------------------------------------------
  async atribuirMelhorVaga(lotId: string, userRole: string, userPcd: boolean) {
    // Busca todas as vagas livres ordenadas por andar e número
    const vagasLivres = await this.prisma.spot.findMany({
      where: { lotId, status: SpotStatus.FREE },
      orderBy: [
        { floor: 'asc' }, // Prioriza andar mais baixo (mais perto da entrada)
        { number: 'asc' }, // Menor número dentro do andar
      ],
    });

    if (vagasLivres.length === 0) {
      throw new NotFoundException(
        'Não há vagas disponíveis neste estacionamento',
      );
    }

    // Prioridade 1: PCD tem prioridade em vagas para deficientes
    if (userPcd) {
      const vagaPcd = vagasLivres.find((v) => v.type === SpotType.DISABLED);
      if (vagaPcd) return vagaPcd;
    }

    // Prioridade 2: Usuário VIP tem acesso a vagas premium
    if (userRole === 'VIP') {
      const vagaVip = vagasLivres.find((v) => v.type === SpotType.VIP);
      if (vagaVip) return vagaVip;
    }

    // Prioridade 3: Primeira vaga padrão disponível
    const vagaPadrao = vagasLivres.find((v) => v.type === SpotType.STANDARD);
    if (vagaPadrao) return vagaPadrao;

    // Se só restam vagas especiais, retorna a primeira disponível
    return vagasLivres[0];
  }

  // -----------------------------------------------------------
  // Calcula a taxa de ocupação do estacionamento (0.0 a 1.0)
  // Usado para determinar se aplica preço dinâmico
  // -----------------------------------------------------------
  async calcularTaxaOcupacao(lotId: string): Promise<number> {
    const [total, ocupadas] = await Promise.all([
      this.prisma.spot.count({ where: { lotId } }),
      this.prisma.spot.count({ where: { lotId, status: SpotStatus.OCCUPIED } }),
    ]);

    if (total === 0) return 0;
    return ocupadas / total;
  }
}

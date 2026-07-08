// =============================================================
// SESSIONS SERVICE — Gerencia o ciclo de vida de uma sessão
// Fluxo: entrada (vaga atribuída) → saída (tarifa calculada)
// =============================================================

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SpotStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpotsService } from '../spots/spots.service';
import { ParkingGateway } from '../gateways/parking.gateway';
import { EntryDto } from './dto/entry.dto';
import { calcularTarifa, calcularMinutos } from './fare.utils';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spotsService: SpotsService,
    // Gateway injetado para emitir eventos WebSocket em tempo real
    private readonly gateway: ParkingGateway,
  ) {}

  // -----------------------------------------------------------
  // Registra a ENTRADA de um veículo e atribui uma vaga
  // -----------------------------------------------------------
  async registrarEntrada(dto: EntryDto, userId: string) {
    // Verifica se o veículo pertence ao usuário autenticado
    const veiculo = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, userId },
    });

    if (!veiculo) {
      throw new ForbiddenException(
        'Veículo não encontrado ou não pertence a você',
      );
    }

    // Verifica se o veículo já tem uma sessão ativa
    const sessaoAtiva = await this.prisma.session.findFirst({
      where: { vehicleId: dto.vehicleId, status: 'ACTIVE' },
    });

    if (sessaoAtiva) {
      throw new BadRequestException('Este veículo já está estacionado');
    }

    // Busca o usuário para aplicar regras de atribuição (PCD, VIP)
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, pcd: true },
    });

    // Atribui a melhor vaga disponível (algoritmo de prioridade)
    const vaga = await this.spotsService.atribuirMelhorVaga(
      dto.lotId,
      usuario.role,
      usuario.pcd,
    );

    // Usa transação para garantir consistência:
    // vaga só é marcada como OCUPADA se a sessão for criada com sucesso
    const sessao = await this.prisma.$transaction(async (tx) => {
      // Marca a vaga como ocupada
      await tx.spot.update({
        where: { id: vaga.id },
        data: { status: SpotStatus.OCCUPIED },
      });

      // Cria a sessão de estacionamento
      return tx.session.create({
        data: {
          vehicleId: dto.vehicleId,
          spotId: vaga.id,
        },
        include: {
          spot: {
            include: { lot: { select: { name: true, pricePerHour: true } } },
          },
          vehicle: { select: { plate: true, model: true } },
        },
      });
    });

    this.logger.log(
      `Entrada: veículo ${veiculo.plate} → vaga ${vaga.sector}${vaga.number} (andar ${vaga.floor})`,
    );

    // Notifica todos os clientes do estacionamento que a vaga foi ocupada
    this.gateway.emitirVagaOcupada(dto.lotId, {
      spotId: vaga.id,
      floor: vaga.floor,
      sector: vaga.sector,
      number: vaga.number,
    });

    return sessao;
  }

  // -----------------------------------------------------------
  // Registra a SAÍDA e calcula o valor a pagar
  // -----------------------------------------------------------
  async registrarSaida(sessionId: string, userId: string) {
    // Busca a sessão verificando se pertence ao usuário
    const sessao = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        status: 'ACTIVE',
        vehicle: { userId },
      },
      include: {
        spot: {
          include: { lot: true },
        },
      },
    });

    if (!sessao) {
      throw new NotFoundException('Sessão ativa não encontrada');
    }

    // Calcula o tempo estacionado
    const agora = new Date();
    const minutos = calcularMinutos(sessao.entryAt, agora);

    // Pega a taxa de ocupação atual para preço dinâmico
    const taxaOcupacao = await this.spotsService.calcularTaxaOcupacao(
      sessao.spot.lotId,
    );

    // Calcula o valor baseado no tempo e ocupação
    const valorTotal = calcularTarifa(
      minutos,
      Number(sessao.spot.lot.pricePerHour),
      taxaOcupacao,
    );

    // Atualiza a sessão com os dados de saída
    const sessaoAtualizada = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        exitAt: agora,
        totalMinutes: minutos,
        totalAmount: valorTotal,
        status: 'COMPLETED',
      },
      include: {
        spot: true,
        vehicle: { select: { plate: true } },
      },
    });

    this.logger.log(
      `Saída: sessão ${sessionId} | ${minutos} min | R$ ${valorTotal}`,
    );

    return {
      ...sessaoAtualizada,
      precoDinamicoAplicado: taxaOcupacao > 0.8,
      taxaOcupacao: Math.round(taxaOcupacao * 100),
    };
  }

  // -----------------------------------------------------------
  // Retorna a sessão ativa do usuário (se houver)
  // -----------------------------------------------------------
  async buscarSessaoAtiva(userId: string) {
    return this.prisma.session.findFirst({
      where: {
        status: 'ACTIVE',
        vehicle: { userId },
      },
      include: {
        spot: {
          include: {
            lot: {
              select: { name: true, pricePerHour: true, dynamicPricing: true },
            },
          },
        },
        vehicle: { select: { plate: true, model: true, color: true } },
      },
    });
  }

  // -----------------------------------------------------------
  // Histórico paginado de sessões do usuário
  // -----------------------------------------------------------
  async buscarHistorico(
    userId: string,
    role: string,
    status?: string,
    pagina = 1,
    limite = 10,
  ) {
    const pular = (pagina - 1) * limite;

    // Apenas DRIVER é restrito aos seus próprios veículos
    const filtroUser = role === 'DRIVER' ? { vehicle: { userId } } : {};

    // Filtro de status: se explicitamente passado, filtra por ele.
    // Se omitido: DRIVER vê apenas finalizadas (não ACTIVE), ADMIN/OPERATOR vê tudo.
    const filtroStatus = status
      ? { status: status as any }
      : role === 'DRIVER'
        ? { status: { not: 'ACTIVE' } }
        : {};

    const [sessoes, total] = await Promise.all([
      this.prisma.session.findMany({
        where: {
          ...filtroStatus,
          ...filtroUser,
        },
        include: {
          spot: {
            include: { lot: { select: { name: true, pricePerHour: true } } },
          },
          vehicle: { select: { plate: true, model: true, color: true } },
          payment: { select: { status: true, method: true, paidAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pular,
        take: limite,
      }),
      this.prisma.session.count({
        where: {
          ...filtroStatus,
          ...filtroUser,
        },
      }),
    ]);

    return {
      dados: sessoes,
      paginacao: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }
}

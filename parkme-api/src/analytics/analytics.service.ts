// =============================================================
// ANALYTICS SERVICE — Métricas e relatórios do estacionamento
// Usado pelo painel do administrador/operador.
// =============================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------
  // Taxa de ocupação atual por andar
  // -----------------------------------------------------------
  async ocupacao(lotId?: string) {
    const where = lotId ? { lotId } : {};

    // Conta vagas totais e ocupadas em paralelo (mais rápido)
    const [total, ocupadas, porAndar] = await Promise.all([
      this.prisma.spot.count({ where }),
      this.prisma.spot.count({ where: { ...where, status: 'OCCUPIED' } }),
      // Agrupa por andar para o detalhamento
      this.prisma.spot.groupBy({
        by: ['floor', 'status'],
        where,
        _count: true,
        orderBy: { floor: 'asc' },
      }),
    ]);

    // Formata o resultado por andar
    const andares: Record<
      number,
      { total: number; ocupadas: number; taxa: string }
    > = {};
    for (const item of porAndar) {
      if (!andares[item.floor]) {
        andares[item.floor] = { total: 0, ocupadas: 0, taxa: '0%' };
      }
      andares[item.floor].total += item._count;
      if (item.status === 'OCCUPIED') {
        andares[item.floor].ocupadas += item._count;
      }
    }
    for (const andar of Object.keys(andares)) {
      const a = andares[Number(andar)];
      a.taxa =
        a.total > 0 ? `${Math.round((a.ocupadas / a.total) * 100)}%` : '0%';
    }

    return {
      total,
      ocupadas,
      livres: total - ocupadas,
      taxaOcupacao:
        total > 0 ? `${Math.round((ocupadas / total) * 100)}%` : '0%',
      precoDinamicoAtivo: total > 0 && ocupadas / total > 0.8,
      porAndar: andares,
    };
  }

  // -----------------------------------------------------------
  // Receita por período (padrão: últimos 30 dias)
  // -----------------------------------------------------------
  async receita(de?: string, ate?: string) {
    const dataInicio = de
      ? new Date(de)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dataFim = ate ? new Date(ate) : new Date();

    const pagamentos = await this.prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        paidAt: { gte: dataInicio, lte: dataFim },
      },
      select: { amount: true, method: true, paidAt: true },
    });

    const totalReceita = pagamentos.reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    );

    // Agrupa por método de pagamento
    const porMetodo = pagamentos.reduce(
      (acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      periodo: { de: dataInicio, ate: dataFim },
      totalPagamentos: pagamentos.length,
      totalReceita: parseFloat(totalReceita.toFixed(2)),
      porMetodo,
    };
  }

  // -----------------------------------------------------------
  // Duração média das sessões em minutos
  // -----------------------------------------------------------
  async duracaoMedia(lotId?: string) {
    // O Prisma não suporta AVG direto, então busca os valores e calcula
    const sessoes = await this.prisma.session.findMany({
      where: {
        status: 'COMPLETED',
        totalMinutes: { not: null },
        ...(lotId && { spot: { lotId } }),
      },
      select: { totalMinutes: true },
    });

    if (sessoes.length === 0) {
      return { totalSessoes: 0, mediaMunutos: 0, mediaFormatada: '0min' };
    }

    const somaMinutos = sessoes.reduce(
      (acc, s) => acc + (s.totalMinutes ?? 0),
      0,
    );
    const media = Math.round(somaMinutos / sessoes.length);

    // Formata para exibição legível
    const horas = Math.floor(media / 60);
    const minutos = media % 60;
    const mediaFormatada =
      horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;

    return {
      totalSessoes: sessoes.length,
      mediaMinutos: media,
      mediaFormatada,
    };
  }
}

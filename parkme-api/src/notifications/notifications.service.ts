// =============================================================
// NOTIFICATIONS SERVICE — Gerenciamento de notificações do usuário
//
// Responsabilidades:
//   - Listar notificações do usuário autenticado (paginado)
//   - Marcar como lida (uma ou todas)
//   - Criar notificação interna (chamado por outros services)
// =============================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------------
  // Lista as notificações do usuário, mais recentes primeiro
  // -----------------------------------------------------------
  async listar(userId: string, pagina = 1, limite = 20) {
    const pular = (pagina - 1) * limite;

    const [notificacoes, total, naoLidas] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        skip: pular,
        take: limite,
        include: {
          // Inclui dados básicos da sessão relacionada (se houver)
          session: {
            select: {
              id: true,
              spot: { select: { sector: true, number: true, floor: true } },
            },
          },
        },
      }),
      this.prisma.notification.count({ where: { userId } }),
      // Contador de não lidas para exibir no badge da tab
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      dados: notificacoes,
      paginacao: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
      naoLidas,
    };
  }

  // -----------------------------------------------------------
  // Marca uma notificação específica como lida
  // -----------------------------------------------------------
  async marcarComoLida(notificacaoId: string, userId: string) {
    // Verifica se a notificação pertence ao usuário
    const notificacao = await this.prisma.notification.findFirst({
      where: { id: notificacaoId, userId },
    });

    if (!notificacao) {
      throw new NotFoundException('Notificação não encontrada');
    }

    // Só atualiza se ainda não foi lida (evita update desnecessário)
    if (notificacao.readAt) {
      return notificacao;
    }

    return this.prisma.notification.update({
      where: { id: notificacaoId },
      data: { readAt: new Date() },
    });
  }

  // -----------------------------------------------------------
  // Marca TODAS as notificações do usuário como lidas de uma vez
  // -----------------------------------------------------------
  async marcarTodasComoLidas(userId: string) {
    const resultado = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return {
      atualizadas: resultado.count,
      message: `${resultado.count} notificação(ões) marcada(s) como lida(s)`,
    };
  }

  // -----------------------------------------------------------
  // MÉTODO INTERNO — Cria uma notificação (usado por outros services)
  // Não é exposto como rota HTTP.
  // -----------------------------------------------------------
  async criar(dados: {
    userId: string;
    type: NotificationType;
    message: string;
    sessionId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: dados.userId,
        type: dados.type,
        message: dados.message,
        sessionId: dados.sessionId,
      },
    });
  }
}

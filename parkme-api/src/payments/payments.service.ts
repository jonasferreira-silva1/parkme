// =============================================================
// PAYMENTS SERVICE — Integração com MercadoPago
// Fluxo: criar pagamento → aguardar webhook → liberar vaga
//
// Em desenvolvimento, o MercadoPago usa sandbox (credenciais TEST-).
// Para produção, troque pelo ACCESS_TOKEN de produção.
// =============================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpotStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ParkingGateway } from '../gateways/parking.gateway';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    // Gateway para notificar em tempo real quando a vaga for liberada
    private readonly gateway: ParkingGateway,
  ) {}

  // -----------------------------------------------------------
  // Cria um pagamento para uma sessão concluída
  // -----------------------------------------------------------
  async criarPagamento(
    sessionId: string,
    dto: CreatePaymentDto,
    userId: string,
  ) {
    // Busca a sessão verificando que pertence ao usuário
    const sessao = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        status: 'COMPLETED', // Só paga sessões já encerradas
        vehicle: { userId },
      },
    });

    if (!sessao) {
      throw new NotFoundException(
        'Sessão não encontrada ou ainda ativa. Registre a saída primeiro.',
      );
    }

    // Verifica se já tem pagamento pendente ou aprovado
    const pagamentoExistente = await this.prisma.payment.findUnique({
      where: { sessionId },
    });

    if (pagamentoExistente?.status === 'APPROVED') {
      throw new BadRequestException('Esta sessão já foi paga');
    }

    const valor = Number(sessao.totalAmount);

    // -----------------------------------------------------------
    // INTEGRAÇÃO MERCADOPAGO
    // Em sandbox, simula o pagamento sem chamar a API real.
    // Para conectar de verdade, instale: npm install mercadopago
    // e descomente o bloco abaixo.
    // -----------------------------------------------------------

    /*
    // Exemplo de integração real com MercadoPago SDK v2:
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    const client = new MercadoPagoConfig({
      accessToken: this.configService.get('MERCADOPAGO_ACCESS_TOKEN'),
    });
    const mpPayment = new Payment(client);
    const resultado = await mpPayment.create({
      body: {
        transaction_amount: valor,
        description: `ParkMe - Sessão ${sessionId}`,
        payment_method_id: dto.method === 'PIX' ? 'pix' : 'visa',
        payer: { email: 'cliente@email.com' },
      },
    });
    */

    // Simulação para desenvolvimento (sandbox)
    const mpPaymentId = `MP_SANDBOX_${Date.now()}`;
    const pixQrCode =
      dto.method === 'PIX'
        ? `00020126580014br.gov.bcb.pix0136${mpPaymentId}5204000053039865802BR5925ParkMe6009SAO PAULO62070503***6304${Math.floor(
            Math.random() * 9999,
          )
            .toString()
            .padStart(4, '0')}`
        : null;

    // Cria o registro de pagamento no banco
    const pagamento = await this.prisma.payment.upsert({
      where: { sessionId },
      create: {
        sessionId,
        amount: valor,
        method: dto.method,
        status: 'PENDING',
        mpPaymentId,
        pixQrCode,
        pixCopyPaste: pixQrCode,
      },
      update: {
        // Se já existia como FAILED, recria
        status: 'PENDING',
        mpPaymentId,
        pixQrCode,
      },
    });

    this.logger.log(
      `Pagamento criado: R$ ${valor} via ${dto.method} | sessão ${sessionId}`,
    );

    return pagamento;
  }

  // -----------------------------------------------------------
  // Consulta o status de um pagamento
  // -----------------------------------------------------------
  async buscarPagamento(id: string, userId: string) {
    const pagamento = await this.prisma.payment.findFirst({
      where: {
        id,
        session: { vehicle: { userId } },
      },
      include: {
        session: {
          select: {
            entryAt: true,
            exitAt: true,
            totalMinutes: true,
            spot: { select: { sector: true, number: true, floor: true } },
          },
        },
      },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return pagamento;
  }

  // -----------------------------------------------------------
  // WEBHOOK — MercadoPago chama esta rota após confirmar o pagamento
  // Este endpoint NÃO tem autenticação JWT (é chamado pelo MP)
  // -----------------------------------------------------------
  async processarWebhook(body: any) {
    // O MercadoPago envia diferentes tipos de notificação
    // Aqui tratamos apenas 'payment' (confirmação de pagamento)
    if (body?.type !== 'payment') {
      return { recebido: true };
    }

    const mpPaymentId = body?.data?.id?.toString();
    if (!mpPaymentId) return { recebido: true };

    // Busca o pagamento pelo ID do MercadoPago
    const pagamento = await this.prisma.payment.findFirst({
      where: { mpPaymentId },
      include: {
        session: {
          include: {
            spot: {
              select: {
                id: true,
                lotId: true,
                floor: true,
                sector: true,
                number: true,
              },
            },
          },
        },
      },
    });

    if (!pagamento) {
      this.logger.warn(
        `Webhook: pagamento ${mpPaymentId} não encontrado no banco`,
      );
      return { recebido: true };
    }

    // Simula consulta ao MercadoPago para confirmar o status
    // Em produção: consultaria a API do MP com o mpPaymentId
    const statusMp = body?.data?.status ?? 'approved'; // Simulação

    if (statusMp === 'approved' && pagamento.status !== 'APPROVED') {
      // Confirma o pagamento e libera a vaga em uma transação
      await this.prisma.$transaction(async (tx) => {
        // Atualiza o pagamento para APROVADO
        await tx.payment.update({
          where: { id: pagamento.id },
          data: { status: 'APPROVED', paidAt: new Date() },
        });

        // Libera a vaga no banco
        await tx.spot.update({
          where: { id: pagamento.session.spotId },
          data: { status: SpotStatus.FREE },
        });
      });

      // Notifica todos os clientes do estacionamento que a vaga foi liberada
      this.gateway.emitirVagaLivre(pagamento.session.spot.lotId, {
        spotId: pagamento.session.spotId,
        floor: pagamento.session.spot.floor,
        sector: pagamento.session.spot.sector,
        number: pagamento.session.spot.number,
      });

      this.logger.log(
        `✅ Pagamento aprovado! Vaga ${pagamento.session.spotId} liberada`,
      );
    }

    return { recebido: true };
  }

  // -----------------------------------------------------------
  // Confirma pagamento manualmente (para testes em desenvolvimento)
  // Simula o callback do MercadoPago sem precisar do webhook real
  // -----------------------------------------------------------
  async confirmarPagamentoManual(paymentId: string) {
    const pagamento = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        session: {
          include: {
            spot: {
              select: {
                id: true,
                lotId: true,
                floor: true,
                sector: true,
                number: true,
              },
            },
          },
        },
      },
    });

    if (!pagamento) throw new NotFoundException('Pagamento não encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'APPROVED', paidAt: new Date() },
      });

      await tx.spot.update({
        where: { id: pagamento.session.spotId },
        data: { status: SpotStatus.FREE },
      });
    });

    // Notifica em tempo real que a vaga foi liberada
    this.gateway.emitirVagaLivre(pagamento.session.spot.lotId, {
      spotId: pagamento.session.spotId,
      floor: pagamento.session.spot.floor,
      sector: pagamento.session.spot.sector,
      number: pagamento.session.spot.number,
    });

    this.logger.log(`✅ [DEV] Pagamento ${paymentId} confirmado manualmente`);
    return { message: 'Pagamento confirmado e vaga liberada' };
  }
}

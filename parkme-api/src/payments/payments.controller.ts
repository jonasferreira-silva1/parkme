// =============================================================
// PAYMENTS CONTROLLER — Rotas de pagamento
// =============================================================

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Pagamentos')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /payments/:sessionId — Inicia pagamento de uma sessão
  @Post(':sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar pagamento para uma sessão' })
  criar(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.criarPagamento(sessionId, dto, userId);
  }

  // GET /payments/:id — Consulta status de um pagamento
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar status do pagamento' })
  buscar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.buscarPagamento(id, userId);
  }

  // POST /payments/webhook — Recebe notificações do MercadoPago
  // Sem autenticação JWT — é chamado pelo servidor do MercadoPago
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook MercadoPago (não requer auth)' })
  webhook(@Body() body: any) {
    return this.paymentsService.processarWebhook(body);
  }

  // POST /payments/:id/confirm-dev — Confirma pagamento manualmente (só DEV)
  @Post(':id/confirm-dev')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEV] Confirmar pagamento manualmente sem webhook',
  })
  confirmarDev(@Param('id') id: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Este endpoint está disponível apenas no ambiente de desenvolvimento.',
      );
    }
    return this.paymentsService.confirmarPagamentoManual(id);
  }
}

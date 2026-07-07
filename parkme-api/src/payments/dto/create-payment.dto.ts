// =============================================================
// DTO — Dados para iniciar um pagamento
// =============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
    description: 'Método de pagamento: PIX, CREDIT ou DEBIT',
  })
  @IsEnum(PaymentMethod, {
    message: 'Método inválido. Use: PIX, CREDIT ou DEBIT',
  })
  method: PaymentMethod;
}

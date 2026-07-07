// =============================================================
// DTO — Dados para atualizar o status de uma vaga manualmente
// =============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SpotStatus } from '@prisma/client';

export class UpdateSpotStatusDto {
  @ApiProperty({
    enum: SpotStatus,
    example: SpotStatus.FREE,
    description: 'Novo status da vaga',
  })
  @IsEnum(SpotStatus, {
    message: 'Status inválido. Use: FREE, OCCUPIED ou RESERVED',
  })
  status: SpotStatus;
}

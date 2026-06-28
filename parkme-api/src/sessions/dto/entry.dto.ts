// =============================================================
// DTO — Dados para registrar entrada de veículo
// =============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EntryDto {
  @ApiProperty({
    example: 'clu1234abcdef',
    description: 'ID do veículo que está entrando',
  })
  @IsString({ message: 'vehicleId deve ser uma string' })
  vehicleId: string;

  @ApiProperty({
    example: 'clu9876xyzabc',
    description: 'ID do estacionamento',
  })
  @IsString({ message: 'lotId deve ser uma string' })
  lotId: string;
}

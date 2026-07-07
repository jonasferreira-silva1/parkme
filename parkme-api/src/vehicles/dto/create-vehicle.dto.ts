// =============================================================
// DTO — Dados para cadastrar um veículo
// =============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({
    example: 'ABC1D23',
    description: 'Placa no formato Mercosul ou antigo',
  })
  @IsString()
  @Matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, {
    message: 'Placa deve estar no formato ABC1D23 ou ABC1234',
  })
  plate: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  brand: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  model: string;

  @ApiProperty({ example: 'Prata' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  color: string;
}

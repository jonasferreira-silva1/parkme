// =============================================================
// DTO (Data Transfer Object) — Dados para registrar usuário
// DTOs definem e validam os dados que chegam nas requisições.
// =============================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString({ message: 'Nome deve ser texto' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({
    example: 'joao@email.com',
    description: 'E-mail único do usuário',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha com letra maiúscula, minúscula e número',
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula e um número',
  })
  password: string;

  @ApiPropertyOptional({
    example: '11999990001',
    description: 'Telefone opcional',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: false, description: 'Usuário é PCD?' })
  @IsOptional()
  @IsBoolean()
  pcd?: boolean;
}

// =============================================================
// DTO — Dados para fazer login
// =============================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joao@parkme.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(6, { message: 'Senha muito curta' })
  password: string;
}

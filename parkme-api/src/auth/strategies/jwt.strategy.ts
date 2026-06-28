// =============================================================
// JWT STRATEGY — Valida o token JWT nas requisições protegidas
// O Passport usa esta estratégia quando o guard @UseGuards(JwtAuthGuard) é aplicado.
// Ele extrai o token do header Authorization: Bearer <token>
// =============================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

// Formato do payload que fica dentro do token JWT
export interface JwtPayload {
  sub: string;  // ID do usuário (sub = subject, padrão JWT)
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extrai o token do header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rejeita tokens expirados
      ignoreExpiration: false,
      // Chave secreta para validar a assinatura
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Este método é chamado automaticamente após validar a assinatura do token.
  // O retorno é injetado em req.user nos controllers.
  async validate(payload: JwtPayload) {
    // Verifica se o usuário ainda existe no banco
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user; // Disponível como req.user nos controllers
  }
}

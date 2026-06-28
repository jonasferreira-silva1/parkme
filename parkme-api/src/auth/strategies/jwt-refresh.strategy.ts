// =============================================================
// JWT REFRESH STRATEGY — Valida o refresh token
// Usado apenas na rota POST /auth/refresh para gerar novos tokens.
// Tem uma chave secreta diferente do access token.
// =============================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      // Passa o request para podermos acessar o token bruto
      passReqToCallback: true,
    });
  }

  // Retorna o payload + o refresh token bruto para o service
  async validate(req: Request, payload: any) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    return { ...payload, refreshToken };
  }
}

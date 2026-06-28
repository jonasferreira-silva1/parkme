// =============================================================
// JWT AUTH GUARD — Protege rotas que exigem autenticação
// Use: @UseGuards(JwtAuthGuard) no controller ou na rota
// =============================================================

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

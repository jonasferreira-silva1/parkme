// =============================================================
// ROLES GUARD — Controle de acesso por papel (role)
// Use junto com o decorator @Roles('ADMIN') para restringir rotas
// Exemplo: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('ADMIN')
// =============================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Nome da chave usada para guardar os roles nos metadados
export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lê os roles definidos com @Roles() no método ou classe
    const rolesPermitidos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Metadado do método
        context.getClass(), // Metadado da classe
      ],
    );

    // Se não há restrição de role, permite o acesso
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }

    // Pega o usuário autenticado do request (colocado pelo JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // Verifica se o role do usuário está na lista de permitidos
    const temPermissao = rolesPermitidos.includes(user?.role);

    if (!temPermissao) {
      throw new ForbiddenException(
        `Acesso negado. Requer papel: ${rolesPermitidos.join(' ou ')}`,
      );
    }

    return true;
  }
}

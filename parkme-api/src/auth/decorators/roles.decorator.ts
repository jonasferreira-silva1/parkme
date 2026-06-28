// =============================================================
// ROLES DECORATOR — Define quais papéis podem acessar uma rota
// Uso: @Roles('ADMIN') ou @Roles('ADMIN', 'OPERATOR')
// =============================================================

import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/roles.guard';

// Atalho para definir roles permitidos numa rota
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

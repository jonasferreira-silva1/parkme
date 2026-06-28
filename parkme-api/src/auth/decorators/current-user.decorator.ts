// =============================================================
// CURRENT USER DECORATOR — Extrai o usuário autenticado do request
// Uso no controller: @CurrentUser() user: User
// Elimina a necessidade de acessar req.user manualmente.
// =============================================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Se passado um campo específico, retorna só ele
    // Ex: @CurrentUser('id') retorna apenas o ID
    return data ? user?.[data] : user;
  },
);

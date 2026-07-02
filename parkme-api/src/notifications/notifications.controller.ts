// =============================================================
// NOTIFICATIONS CONTROLLER — Rotas de notificações do usuário
// =============================================================

import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications — Lista notificações do usuário logado
  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário (paginado)' })
  @ApiQuery({ name: 'page',  required: false, example: 1  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  listar(
    @CurrentUser('id') userId: string,
    @Query('page')  page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listar(
      userId,
      page  ? parseInt(page)  : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // PATCH /notifications/read-all — Marca todas como lidas
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  marcarTodas(@CurrentUser('id') userId: string) {
    return this.notificationsService.marcarTodasComoLidas(userId);
  }

  // PATCH /notifications/:id/read — Marca uma notificação como lida
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar uma notificação como lida' })
  marcarUma(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.marcarComoLida(id, userId);
  }
}

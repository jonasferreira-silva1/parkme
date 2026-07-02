import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  // Exporta o service para outros módulos criarem notificações internamente
  exports: [NotificationsService],
})
export class NotificationsModule {}

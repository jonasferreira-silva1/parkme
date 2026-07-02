import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SpotsModule } from '../spots/spots.module';
import { GatewaysModule } from '../gateways/gateways.module';

@Module({
  imports: [
    SpotsModule,     // Precisa do SpotsService para atribuir vagas
    GatewaysModule,  // Precisa do ParkingGateway para emitir eventos WebSocket
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

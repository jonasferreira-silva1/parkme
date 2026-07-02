import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { GatewaysModule } from '../gateways/gateways.module';

@Module({
  imports: [GatewaysModule], // Precisa do ParkingGateway para emitir evento de vaga liberada
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

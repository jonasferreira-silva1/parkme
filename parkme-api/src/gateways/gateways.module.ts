import { Module } from '@nestjs/common';
import { ParkingGateway } from './parking.gateway';

@Module({
  providers: [ParkingGateway],
  exports: [ParkingGateway], // Exportado para outros módulos emitirem eventos
})
export class GatewaysModule {}

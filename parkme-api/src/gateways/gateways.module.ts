import { Module } from '@nestjs/common';
import { ParkingGateway } from './parking.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ParkingGateway],
  exports: [ParkingGateway], // Exportado para outros módulos emitirem eventos
})
export class GatewaysModule {}

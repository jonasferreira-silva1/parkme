import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SpotsModule } from '../spots/spots.module';

@Module({
  imports: [SpotsModule], // Precisa do SpotsService para atribuir vagas
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

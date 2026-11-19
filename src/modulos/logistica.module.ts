import { Module } from '@nestjs/common';
import { LogisticaService } from '../services/logistica.service';
import { LogisticaController } from '../controllers/logistica.controller';
@Module({
  controllers: [LogisticaController],
  providers: [LogisticaService],
  exports: [LogisticaService],
})
export class LogisticaModule {}

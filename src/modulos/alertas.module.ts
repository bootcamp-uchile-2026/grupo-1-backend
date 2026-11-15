import { Module } from '@nestjs/common';
import { AlertasController } from '../controllers/alertas.controller';
import { AlertasService } from '../services/alertas.service';
import { AlertasRepository } from '../repositorios/alertas.repository';
import { DummyAlertasRepository } from '../repositorios/dummy/dummy-alertas.repository';
import { UsuariosModule } from './usuarios.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, ProductosModule],
  controllers: [AlertasController],
  providers: [
    AlertasService,
    DummyAlertasRepository,
    { provide: AlertasRepository, useExisting: DummyAlertasRepository },
  ],
  exports: [AlertasService, AlertasRepository],
})
export class AlertasModule {}

import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';
import { TypeOrmAlertasRepository } from '../repositorios/typeorm/typeorm-alertas.repository';
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
    proveerDummy(DummyAlertasRepository),
    proveerRepositorio(
      AlertasRepository,
      DummyAlertasRepository,
      TypeOrmAlertasRepository,
    ),
  ],
  exports: [AlertasService, AlertasRepository],
})
export class AlertasModule {}

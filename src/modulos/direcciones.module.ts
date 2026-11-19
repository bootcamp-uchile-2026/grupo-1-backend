import { Module } from '@nestjs/common';
import { DireccionesController } from '../controllers/direcciones.controller';
import { DireccionesService } from '../services/direcciones.service';
import { DireccionesRepository } from '../repositorios/direcciones.repository';
import { DummyDireccionesRepository } from '../repositorios/dummy/dummy-direcciones.repository';
import { UsuariosModule } from './usuarios.module';
import { TypeOrmDireccionesRepository } from '../repositorios/typeorm/typeorm-direcciones.repository';
import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';

@Module({
  imports: [UsuariosModule],
  controllers: [DireccionesController],
  providers: [
    DireccionesService,
    proveerDummy(DummyDireccionesRepository),
    proveerRepositorio(
      DireccionesRepository,
      DummyDireccionesRepository,
      TypeOrmDireccionesRepository,
    ),
  ],
  exports: [DireccionesService, DireccionesRepository],
})
export class DireccionesModule {}

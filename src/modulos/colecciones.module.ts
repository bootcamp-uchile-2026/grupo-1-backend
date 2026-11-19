import { TypeOrmColeccionesRepository } from '../repositorios/typeorm/typeorm-colecciones.repository';
import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';
import { Module } from '@nestjs/common';
import { ColeccionesController } from '../controllers/colecciones.controller';
import { ColeccionesService } from '../services/colecciones.service';
import { ColeccionesRepository } from '../repositorios/colecciones.repository';
import { DummyColeccionesRepository } from '../repositorios/dummy/dummy-colecciones.repository';

@Module({
  imports: [],
  controllers: [ColeccionesController],
  providers: [
    ColeccionesService,
    proveerDummy(DummyColeccionesRepository),
    proveerRepositorio(
      ColeccionesRepository,
      DummyColeccionesRepository,
      TypeOrmColeccionesRepository,
    ),
  ],
  exports: [ColeccionesService, ColeccionesRepository],
})
export class ColeccionesModule {}

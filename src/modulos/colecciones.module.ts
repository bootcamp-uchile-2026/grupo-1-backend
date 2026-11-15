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
    DummyColeccionesRepository,
    { provide: ColeccionesRepository, useExisting: DummyColeccionesRepository },
  ],
  exports: [ColeccionesService, ColeccionesRepository],
})
export class ColeccionesModule {}

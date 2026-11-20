import { DataSource } from 'typeorm';
import { TypeOrmColeccionesRepository } from '../repositorios/typeorm/typeorm-colecciones.repository';
import { Module } from '@nestjs/common';
import { ColeccionesController } from '../controllers/colecciones.controller';
import { ColeccionesService } from '../services/colecciones.service';
import { ColeccionesRepository } from '../repositorios/colecciones.repository';

@Module({
  imports: [],
  controllers: [ColeccionesController],
  providers: [
    ColeccionesService,
    {
      provide: ColeccionesRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeOrmColeccionesRepository(source),
    },
  ],
  exports: [ColeccionesService, ColeccionesRepository],
})
export class ColeccionesModule {}

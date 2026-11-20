import { DataSource } from 'typeorm';
import { TypeOrmCategoriasRepository } from '../repositorios/typeorm/typeorm-categorias.repository';
import { Module } from '@nestjs/common';
import { CategoriasController } from '../controllers/categorias.controller';
import { CategoriasService } from '../services/categorias.service';
import { CategoriasRepository } from '../repositorios/categorias.repository';

@Module({
  imports: [],
  controllers: [CategoriasController],
  providers: [
    CategoriasService,
    {
      provide: CategoriasRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeOrmCategoriasRepository(source),
    },
  ],
  exports: [CategoriasService, CategoriasRepository],
})
export class CategoriasModule {}

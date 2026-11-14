import { Module } from '@nestjs/common';
import { CategoriasController } from '../controllers/categorias.controller';
import { CategoriasService } from '../services/categorias.service';
import { CategoriasRepository } from '../repositorios/categorias.repository';
import { DummyCategoriasRepository } from '../repositorios/dummy/dummy-categorias.repository';

@Module({
  imports: [],
  controllers: [CategoriasController],
  providers: [
    CategoriasService,
    DummyCategoriasRepository,
    { provide: CategoriasRepository, useExisting: DummyCategoriasRepository },
  ],
  exports: [CategoriasService, CategoriasRepository],
})
export class CategoriasModule {}

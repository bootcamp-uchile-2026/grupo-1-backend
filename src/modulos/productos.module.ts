import { Module } from '@nestjs/common';
import { ProductosController } from '../controllers/productos.controller';
import { ProductosService } from '../services/productos.service';
import { ProductosRepository } from '../repositorios/productos.repository';
import { DummyProductosRepository } from '../repositorios/dummy/dummy-productos.repository';
import { TypeOrmProductosRepository } from '../repositorios/typeorm/typeorm-productos.repository';
import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';

@Module({
  imports: [],
  controllers: [ProductosController],
  providers: [
    ProductosService,
    proveerDummy(DummyProductosRepository),
    proveerRepositorio(
      ProductosRepository,
      DummyProductosRepository,
      TypeOrmProductosRepository,
    ),
  ],
  exports: [ProductosService, ProductosRepository],
})
export class ProductosModule {}

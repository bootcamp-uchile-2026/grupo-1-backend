import { Module } from '@nestjs/common';
import { ProductosController } from '../controllers/productos.controller';
import { ProductosService } from '../services/productos.service';
import { ProductosRepository } from '../repositorios/productos.repository';
import { DummyProductosRepository } from '../repositorios/dummy/dummy-productos.repository';

@Module({
  imports: [],
  controllers: [ProductosController],
  providers: [
    ProductosService,
    DummyProductosRepository,
    { provide: ProductosRepository, useExisting: DummyProductosRepository },
  ],
  exports: [ProductosService, ProductosRepository],
})
export class ProductosModule {}

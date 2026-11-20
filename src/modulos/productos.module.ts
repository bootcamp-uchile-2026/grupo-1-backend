import { DataSource } from 'typeorm';
import { Module } from '@nestjs/common';
import { ProductosController } from '../controllers/productos.controller';
import { ProductosService } from '../services/productos.service';
import { ProductosRepository } from '../repositorios/productos.repository';
import { TypeOrmProductosRepository } from '../repositorios/typeorm/typeorm-productos.repository';

@Module({
  imports: [],
  controllers: [ProductosController],
  providers: [
    ProductosService,
    {
      provide: ProductosRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeOrmProductosRepository(source),
    },
  ],
  exports: [ProductosService, ProductosRepository],
})
export class ProductosModule {}

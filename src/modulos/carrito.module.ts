import { DataSource } from 'typeorm';
import { TypeOrmCarritosRepository } from '../repositorios/typeorm/typeorm-carritos.repository';
import { Module } from '@nestjs/common';
import { CarritoController } from '../controllers/carrito.controller';
import { CarritoService } from '../services/carrito.service';
import { CarritosRepository } from '../repositorios/carritos.repository';
import { UsuariosModule } from './usuarios.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, ProductosModule],
  controllers: [CarritoController],
  providers: [
    CarritoService,
    {
      provide: CarritosRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeOrmCarritosRepository(source),
    },
  ],
  exports: [CarritoService, CarritosRepository],
})
export class CarritoModule {}

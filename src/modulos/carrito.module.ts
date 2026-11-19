import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';
import { TypeOrmCarritosRepository } from '../repositorios/typeorm/typeorm-carritos.repository';
import { Module } from '@nestjs/common';
import { CarritoController } from '../controllers/carrito.controller';
import { CarritoService } from '../services/carrito.service';
import { CarritosRepository } from '../repositorios/carritos.repository';
import { DummyCarritosRepository } from '../repositorios/dummy/dummy-carritos.repository';
import { UsuariosModule } from './usuarios.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, ProductosModule],
  controllers: [CarritoController],
  providers: [
    CarritoService,
    proveerDummy(DummyCarritosRepository),
    proveerRepositorio(
      CarritosRepository,
      DummyCarritosRepository,
      TypeOrmCarritosRepository,
    ),
  ],
  exports: [CarritoService, CarritosRepository],
})
export class CarritoModule {}

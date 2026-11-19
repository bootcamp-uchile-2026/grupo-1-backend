import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';
import { TypeOrmPedidosRepository } from '../repositorios/typeorm/typeorm-pedidos.repository';
import { Module } from '@nestjs/common';
import { PedidosController } from '../controllers/pedidos.controller';
import { PedidosService } from '../services/pedidos.service';
import { PedidosRepository } from '../repositorios/pedidos.repository';
import { DummyPedidosRepository } from '../repositorios/dummy/dummy-pedidos.repository';
import { UsuariosModule } from './usuarios.module';
import { CarritoModule } from './carrito.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, CarritoModule, ProductosModule],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    proveerDummy(DummyPedidosRepository),
    proveerRepositorio(
      PedidosRepository,
      DummyPedidosRepository,
      TypeOrmPedidosRepository,
    ),
  ],
  exports: [PedidosService, PedidosRepository],
})
export class PedidosModule {}

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
    DummyPedidosRepository,
    { provide: PedidosRepository, useExisting: DummyPedidosRepository },
  ],
  exports: [PedidosService, PedidosRepository],
})
export class PedidosModule {}

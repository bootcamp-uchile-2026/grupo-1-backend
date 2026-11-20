import { DataSource } from 'typeorm';
import { TypeOrmPedidosRepository } from '../repositorios/typeorm/typeorm-pedidos.repository';
import { Module } from '@nestjs/common';
import { PedidosController } from '../controllers/pedidos.controller';
import { PedidosService } from '../services/pedidos.service';
import { PedidosRepository } from '../repositorios/pedidos.repository';
import { UsuariosModule } from './usuarios.module';

@Module({
  imports: [UsuariosModule],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    {
      provide: PedidosRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeOrmPedidosRepository(source),
    },
  ],
  exports: [PedidosService, PedidosRepository],
})
export class PedidosModule {}

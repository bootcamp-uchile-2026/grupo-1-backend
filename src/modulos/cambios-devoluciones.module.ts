import { DataSource } from 'typeorm';
import { TypeOrmCambiosDevolucionesRepository } from '../repositorios/typeorm/typeorm-cambios-devoluciones.repository';
import { Module } from '@nestjs/common';
import { CambiosDevolucionesController } from '../controllers/cambios-devoluciones.controller';
import { CambiosDevolucionesService } from '../services/cambios-devoluciones.service';
import { CambiosDevolucionesRepository } from '../repositorios/cambios-devoluciones.repository';
import { PedidosModule } from './pedidos.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [PedidosModule, ProductosModule],
  controllers: [CambiosDevolucionesController],
  providers: [
    CambiosDevolucionesService,
    {
      provide: CambiosDevolucionesRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeOrmCambiosDevolucionesRepository(source),
    },
  ],
  exports: [CambiosDevolucionesService, CambiosDevolucionesRepository],
})
export class CambiosDevolucionesModule {}

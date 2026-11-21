import { DataSource } from 'typeorm';
import { TypeOrmAlertasRepository } from '../repositorios/typeorm/typeorm-alertas.repository';
import { Module } from '@nestjs/common';
import { AlertasController } from '../controllers/alertas.controller';
import { AlertasService } from '../services/alertas.service';
import { AlertasRepository } from '../repositorios/alertas.repository';
import { UsuariosModule } from './usuarios.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, ProductosModule],
  controllers: [AlertasController],
  providers: [
    AlertasService,
    {
      provide: AlertasRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeOrmAlertasRepository(source),
    },
  ],
  exports: [AlertasService, AlertasRepository],
})
export class AlertasModule {}

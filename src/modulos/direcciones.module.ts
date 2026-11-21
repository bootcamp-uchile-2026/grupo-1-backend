import { DataSource } from 'typeorm';
import { Module } from '@nestjs/common';
import { DireccionesController } from '../controllers/direcciones.controller';
import { DireccionesService } from '../services/direcciones.service';
import { DireccionesRepository } from '../repositorios/direcciones.repository';
import { UsuariosModule } from './usuarios.module';
import { TypeOrmDireccionesRepository } from '../repositorios/typeorm/typeorm-direcciones.repository';

@Module({
  imports: [UsuariosModule],
  controllers: [DireccionesController],
  providers: [
    DireccionesService,
    {
      provide: DireccionesRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeOrmDireccionesRepository(source),
    },
  ],
  exports: [DireccionesService, DireccionesRepository],
})
export class DireccionesModule {}

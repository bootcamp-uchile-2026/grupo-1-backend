import { Module } from '@nestjs/common';
import { DireccionesController } from '../controllers/direcciones.controller';
import { DireccionesService } from '../services/direcciones.service';
import { DireccionesRepository } from '../repositorios/direcciones.repository';
import { DummyDireccionesRepository } from '../repositorios/dummy/dummy-direcciones.repository';
import { UsuariosModule } from './usuarios.module';

@Module({
  imports: [UsuariosModule],
  controllers: [DireccionesController],
  providers: [
    DireccionesService,
    DummyDireccionesRepository,
    { provide: DireccionesRepository, useExisting: DummyDireccionesRepository },
  ],
  exports: [DireccionesService, DireccionesRepository],
})
export class DireccionesModule {}

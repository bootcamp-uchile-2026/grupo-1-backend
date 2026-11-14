import { Module } from '@nestjs/common';
import { UsuariosController } from '../controllers/usuarios.controller';
import { UsuariosService } from '../services/usuarios.service';
import { UsuariosRepository } from '../repositorios/usuarios.repository';
import { DummyUsuariosRepository } from '../repositorios/dummy/dummy-usuarios.repository';
import { CredencialesRepository } from '../repositorios/credenciales.repository';
import { DummyCredencialesRepository } from '../repositorios/dummy/dummy-credenciales.repository';

@Module({
  imports: [],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    DummyUsuariosRepository,
    { provide: UsuariosRepository, useExisting: DummyUsuariosRepository },
    DummyCredencialesRepository,
    {
      provide: CredencialesRepository,
      useExisting: DummyCredencialesRepository,
    },
  ],
  exports: [UsuariosService, UsuariosRepository, CredencialesRepository],
})
export class UsuariosModule {}

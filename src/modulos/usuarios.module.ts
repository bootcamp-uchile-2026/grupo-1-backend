import { Module } from '@nestjs/common';
import { UsuariosController } from '../controllers/usuarios.controller';
import { UsuariosService } from '../services/usuarios.service';
import { UsuariosRepository } from '../repositorios/usuarios.repository';
import { DummyUsuariosRepository } from '../repositorios/dummy/dummy-usuarios.repository';
import { CredencialesRepository } from '../repositorios/credenciales.repository';
import { DummyCredencialesRepository } from '../repositorios/dummy/dummy-credenciales.repository';
import { TypeOrmUsuariosRepository } from '../repositorios/typeorm/typeorm-usuarios.repository';
import { TypeOrmCredencialesRepository } from '../repositorios/typeorm/typeorm-credenciales.repository';
import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';

@Module({
  imports: [],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    proveerDummy(DummyUsuariosRepository),
    proveerRepositorio(
      UsuariosRepository,
      DummyUsuariosRepository,
      TypeOrmUsuariosRepository,
    ),
    proveerDummy(DummyCredencialesRepository),
    proveerRepositorio(
      CredencialesRepository,
      DummyCredencialesRepository,
      TypeOrmCredencialesRepository,
    ),
  ],
  exports: [UsuariosService, UsuariosRepository, CredencialesRepository],
})
export class UsuariosModule {}

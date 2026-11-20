import { DataSource } from 'typeorm';
import { Module } from '@nestjs/common';
import { UsuariosController } from '../controllers/usuarios.controller';
import { UsuariosService } from '../services/usuarios.service';
import { UsuariosRepository } from '../repositorios/usuarios.repository';
import { CredencialesRepository } from '../repositorios/credenciales.repository';
import { TypeOrmUsuariosRepository } from '../repositorios/typeorm/typeorm-usuarios.repository';
import { TypeOrmCredencialesRepository } from '../repositorios/typeorm/typeorm-credenciales.repository';

@Module({
  imports: [],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    {
      provide: UsuariosRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) => new TypeOrmUsuariosRepository(source),
    },
    {
      provide: CredencialesRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeOrmCredencialesRepository(source),
    },
  ],
  exports: [UsuariosService, UsuariosRepository, CredencialesRepository],
})
export class UsuariosModule {}

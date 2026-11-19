import {
  proveerRepositorio,
  proveerDummy,
} from '../persistencia/proveer-repositorio';
import { TypeOrmFavoritosRepository } from '../repositorios/typeorm/typeorm-favoritos.repository';
import { Module } from '@nestjs/common';
import { FavoritosController } from '../controllers/favoritos.controller';
import { FavoritosService } from '../services/favoritos.service';
import { FavoritosRepository } from '../repositorios/favoritos.repository';
import { DummyFavoritosRepository } from '../repositorios/dummy/dummy-favoritos.repository';
import { UsuariosModule } from './usuarios.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, ProductosModule],
  controllers: [FavoritosController],
  providers: [
    FavoritosService,
    proveerDummy(DummyFavoritosRepository),
    proveerRepositorio(
      FavoritosRepository,
      DummyFavoritosRepository,
      TypeOrmFavoritosRepository,
    ),
  ],
  exports: [FavoritosService, FavoritosRepository],
})
export class FavoritosModule {}

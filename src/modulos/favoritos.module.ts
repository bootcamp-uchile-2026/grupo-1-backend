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
    DummyFavoritosRepository,
    { provide: FavoritosRepository, useExisting: DummyFavoritosRepository },
  ],
  exports: [FavoritosService, FavoritosRepository],
})
export class FavoritosModule {}

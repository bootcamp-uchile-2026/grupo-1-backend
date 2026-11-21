import { DataSource } from 'typeorm';
import { TypeOrmFavoritosRepository } from '../repositorios/typeorm/typeorm-favoritos.repository';
import { Module } from '@nestjs/common';
import { FavoritosController } from '../controllers/favoritos.controller';
import { FavoritosService } from '../services/favoritos.service';
import { FavoritosRepository } from '../repositorios/favoritos.repository';
import { UsuariosModule } from './usuarios.module';
import { ProductosModule } from './productos.module';

@Module({
  imports: [UsuariosModule, ProductosModule],
  controllers: [FavoritosController],
  providers: [
    FavoritosService,
    {
      provide: FavoritosRepository,
      inject: [DataSource],
      useFactory: (source: DataSource) =>
        new TypeOrmFavoritosRepository(source),
    },
  ],
  exports: [FavoritosService, FavoritosRepository],
})
export class FavoritosModule {}

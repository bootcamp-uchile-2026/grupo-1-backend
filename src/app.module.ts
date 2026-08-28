import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { CarritoController } from './controllers/carrito.controller';
import { CategoriasController } from './controllers/categorias.controller';
import { ColeccionesController } from './controllers/colecciones.controller';
import { ComunidadController } from './controllers/comunidad.controller';
import { FavoritosController } from './controllers/favoritos.controller';
import { ProductosController } from './controllers/productos.controller';
import { AuthService } from './services/auth.service';
import { CarritoService } from './services/carrito.service';
import { CategoriasService } from './services/categorias.service';
import { ColeccionesService } from './services/colecciones.service';
import { ComunidadService } from './services/comunidad.service';
import { FavoritosService } from './services/favoritos.service';
import { ProductosService } from './services/productos.service';

/**
 * Modulo raiz de StyleNow.
 * Hito 1 mantiene un unico modulo para que la estructura siga siendo simple:
 * todos los controladores viven en src/controllers y todos los servicios en
 * src/services.
 */
@Module({
  imports: [],
  controllers: [
    ProductosController,
    CategoriasController,
    ColeccionesController,
    AuthController,
    CarritoController,
    FavoritosController,
    ComunidadController,
  ],
  providers: [
    ProductosService,
    CategoriasService,
    ColeccionesService,
    AuthService,
    CarritoService,
    FavoritosService,
    ComunidadService,
  ],
})
export class AppModule {}

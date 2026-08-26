import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriasController } from './categorias.controller';
import { ColeccionesController } from './colecciones.controller';
import { ProductosController } from './productos.controller';
import { AuthController } from './auth.controller';
import { CarritoController } from './carrito.controller';
import { ComunidadController } from './comunidad.controller';
import { CategoriasService } from './categorias.service';
import { ColeccionesService } from './colecciones.service';
import { ProductosService } from './productos.service';
import { AuthService } from './auth.service';
import { UsuariosService } from './usuarios.service';
import { CarritoService } from './carrito.service';
import { ComunidadService } from './comunidad.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    CategoriasController,
    ColeccionesController,
    ProductosController,
    AuthController,
    CarritoController,
    ComunidadController,
  ],
  providers: [
    AppService,
    CategoriasService,
    ColeccionesService,
    ProductosService,
    AuthService,
    UsuariosService,
    CarritoService,
    ComunidadService,
  ],
})
export class AppModule {}

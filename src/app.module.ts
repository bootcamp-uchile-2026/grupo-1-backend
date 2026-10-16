import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { PedidosController } from './controllers/pedidos.controller';
import { PedidosService } from './services/pedidos.service';

import { UsuariosController } from './controllers/usuarios.controller';
import { UsuariosService } from './services/usuarios.service';
import { DireccionesController } from './controllers/direcciones.controller';
import { DireccionesService } from './services/direcciones.service';
import { LooksController } from './controllers/looks.controller';
import { LooksService } from './services/looks.service';
import { AlertasController } from './controllers/alertas.controller';
import { AlertasService } from './services/alertas.service';
import { CambiosDevolucionesController } from './controllers/cambios-devoluciones.controller';
import { CambiosDevolucionesService } from './services/cambios-devoluciones.service';
import { UsuariosRepository } from './repositorios/usuarios.repository';
import { DummyUsuariosRepository } from './repositorios/dummy/dummy-usuarios.repository';
import { DireccionesRepository } from './repositorios/direcciones.repository';
import { DummyDireccionesRepository } from './repositorios/dummy/dummy-direcciones.repository';
import { CategoriasRepository } from './repositorios/categorias.repository';
import { DummyCategoriasRepository } from './repositorios/dummy/dummy-categorias.repository';
import { ProductosRepository } from './repositorios/productos.repository';
import { DummyProductosRepository } from './repositorios/dummy/dummy-productos.repository';
import { PedidosRepository } from './repositorios/pedidos.repository';
import { DummyPedidosRepository } from './repositorios/dummy/dummy-pedidos.repository';
import { LooksRepository } from './repositorios/looks.repository';
import { DummyLooksRepository } from './repositorios/dummy/dummy-looks.repository';
import { AlertasRepository } from './repositorios/alertas.repository';
import { DummyAlertasRepository } from './repositorios/dummy/dummy-alertas.repository';
import { CambiosDevolucionesRepository } from './repositorios/cambios-devoluciones.repository';
import { DummyCambiosDevolucionesRepository } from './repositorios/dummy/dummy-cambios-devoluciones.repository';
import { CarritosRepository } from './repositorios/carritos.repository';
import { DummyCarritosRepository } from './repositorios/dummy/dummy-carritos.repository';
import { CredencialesRepository } from './repositorios/credenciales.repository';
import { DummyCredencialesRepository } from './repositorios/dummy/dummy-credenciales.repository';
import { FavoritosRepository } from './repositorios/favoritos.repository';
import { DummyFavoritosRepository } from './repositorios/dummy/dummy-favoritos.repository';
import { ColeccionesRepository } from './repositorios/colecciones.repository';
import { DummyColeccionesRepository } from './repositorios/dummy/dummy-colecciones.repository';
import { PostsRepository } from './repositorios/posts.repository';
import { DummyPostsRepository } from './repositorios/dummy/dummy-posts.repository';

/**
 * Modulo raiz de StyleNow.
 * Se mantiene un unico modulo para que la estructura siga siendo simple:
 * todos los controladores viven en src/controllers y todos los servicios en
 * src/services. src/common guarda lo transversal a todos los dominios.
 *
 * Persistencia: cada servicio depende del contrato abstracto XRepository.
 * Hoy se resuelve con la implementacion Dummy (en memoria, con estado);
 * cambiar de implementacion solo toca esta lista.
 */
const REPOSITORIOS = [
  DummyUsuariosRepository,
  { provide: UsuariosRepository, useExisting: DummyUsuariosRepository },
  DummyDireccionesRepository,
  { provide: DireccionesRepository, useExisting: DummyDireccionesRepository },
  DummyCategoriasRepository,
  { provide: CategoriasRepository, useExisting: DummyCategoriasRepository },
  DummyProductosRepository,
  { provide: ProductosRepository, useExisting: DummyProductosRepository },
  DummyPedidosRepository,
  { provide: PedidosRepository, useExisting: DummyPedidosRepository },
  DummyLooksRepository,
  { provide: LooksRepository, useExisting: DummyLooksRepository },
  DummyAlertasRepository,
  { provide: AlertasRepository, useExisting: DummyAlertasRepository },
  DummyCambiosDevolucionesRepository,
  {
    provide: CambiosDevolucionesRepository,
    useExisting: DummyCambiosDevolucionesRepository,
  },
  DummyCarritosRepository,
  { provide: CarritosRepository, useExisting: DummyCarritosRepository },
  DummyCredencialesRepository,
  {
    provide: CredencialesRepository,
    useExisting: DummyCredencialesRepository,
  },
  DummyFavoritosRepository,
  { provide: FavoritosRepository, useExisting: DummyFavoritosRepository },
  DummyColeccionesRepository,
  {
    provide: ColeccionesRepository,
    useExisting: DummyColeccionesRepository,
  },
  DummyPostsRepository,
  { provide: PostsRepository, useExisting: DummyPostsRepository },
];

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    ProductosController,
    CategoriasController,
    ColeccionesController,
    AuthController,
    CarritoController,
    FavoritosController,
    ComunidadController,
    PedidosController,
    UsuariosController,
    DireccionesController,
    LooksController,
    AlertasController,
    CambiosDevolucionesController,
  ],
  providers: [
    ProductosService,
    CategoriasService,
    ColeccionesService,
    AuthService,
    CarritoService,
    FavoritosService,
    ComunidadService,
    PedidosService,
    UsuariosService,
    DireccionesService,
    LooksService,
    AlertasService,
    CambiosDevolucionesService,
    ...REPOSITORIOS,
  ],
})
export class AppModule {}

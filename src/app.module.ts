import { ImagenesModule } from './imagenes/imagenes.module';
import { LogisticaModule } from './modulos/logistica.module';
import { validarEntorno } from './validar-entorno';
import { PersistenciaModule } from './persistencia/persistencia.module';
import { SeguridadModule } from './seguridad/seguridad.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsuariosModule } from './modulos/usuarios.module';
import { ProductosModule } from './modulos/productos.module';
import { CategoriasModule } from './modulos/categorias.module';
import { ColeccionesModule } from './modulos/colecciones.module';
import { ComunidadModule } from './modulos/comunidad.module';
import { CarritoModule } from './modulos/carrito.module';
import { AuthModule } from './modulos/auth.module';
import { DireccionesModule } from './modulos/direcciones.module';
import { FavoritosModule } from './modulos/favoritos.module';
import { LooksModule } from './modulos/looks.module';
import { AlertasModule } from './modulos/alertas.module';
import { PedidosModule } from './modulos/pedidos.module';
import { CambiosDevolucionesModule } from './modulos/cambios-devoluciones.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    PersistenciaModule,
    LogisticaModule,
    ImagenesModule,
    SeguridadModule,
    UsuariosModule,
    ProductosModule,
    CategoriasModule,
    ColeccionesModule,
    ComunidadModule,
    CarritoModule,
    AuthModule,
    DireccionesModule,
    FavoritosModule,
    LooksModule,
    AlertasModule,
    PedidosModule,
    CambiosDevolucionesModule,
  ],
})
export class AppModule {}

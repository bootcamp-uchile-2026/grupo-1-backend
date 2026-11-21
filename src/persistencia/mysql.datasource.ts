import { CargaImagen, PermisoUsuario } from './imagenes.entidades';
import { CrearCargasImagenes1795350400000 } from './migraciones/1795350400000-crear-cargas-imagenes';
import { IntegridadComercio1795450400000 } from './migraciones/1795450400000-integridad-comercio';
import { CrearAlertas1795250400000 } from './migraciones/1795250400000-crearalertas';
import { CrearLooks1795250401000 } from './migraciones/1795250401000-crearlooks';
import { CrearLogistica1795250402000 } from './migraciones/1795250402000-crearlogistica';
import { CrearPostventa1795250403000 } from './migraciones/1795250403000-crearpostventa';
import { ENTIDADES_P4 } from './p4.entidades';
import { SembrarP41795250404000 } from './migraciones/1795250404000-sembrar-p4';
import { SembrarComercio1795150401000 } from './migraciones/1795150401000-sembrar-comercio';
import {
  CarritoFila,
  CarritoItemFila,
  FavoritoFila,
  PedidoFila,
  PedidoItemFila,
} from './comercio.entidades';
import { CrearComercio1795150400000 } from './migraciones/1795150400000-crear-comercio';
import { validarConexionMysql } from '../validar-entorno';
import { Categoria, Coleccion, Post } from './entidades';
import { CrearCategoriasEditorial1794650400000 } from './migraciones/1794650400000-crear-categorias-editorial';
import { SembrarCategoriasEditorial1794650401000 } from './migraciones/1794650401000-sembrar-categorias-editorial';
import { DataSource, DataSourceOptions } from 'typeorm';
import {
  Producto,
  Variante,
  ProductoImagen,
  ProductoColor,
  ProductoTalla,
} from './productos.entidades';
import { CrearProductos1794950400000 } from './migraciones/1794950400000-crear-productos';
import { SembrarProductos1794950401000 } from './migraciones/1794950401000-sembrar-productos';
import {
  CredencialFila,
  DireccionFila,
  UsuarioFila,
} from './identidad.entidades';
import { CrearIdentidad1795050400000 } from './migraciones/1795050400000-crear-identidad';
import { SembrarIdentidad1795050401000 } from './migraciones/1795050401000-sembrar-identidad';

export function opcionesMysql(
  entorno: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const conexion = validarConexionMysql(entorno);
  return {
    type: 'mysql',
    host: conexion.DB_HOST,
    port: Number(conexion.DB_PORT),
    username: conexion.DB_USERNAME,
    password: conexion.DB_PASSWORD,
    database: conexion.DB_DATABASE,
    timezone: 'Z',
    charset: 'utf8mb4',
    synchronize: false,
    migrationsRun: false,
    logging: false,
    connectTimeout: 5000,
    entities: [
      CargaImagen,
      PermisoUsuario,
      ...ENTIDADES_P4,
      CarritoFila,
      CarritoItemFila,
      FavoritoFila,
      PedidoFila,
      PedidoItemFila,
      Categoria,
      Coleccion,
      Post,
      Producto,
      Variante,
      ProductoImagen,
      ProductoColor,
      ProductoTalla,
      UsuarioFila,
      CredencialFila,
      DireccionFila,
    ],
    migrations: [
      CrearCategoriasEditorial1794650400000,
      SembrarCategoriasEditorial1794650401000,
      CrearProductos1794950400000,
      SembrarProductos1794950401000,
      CrearIdentidad1795050400000,
      SembrarIdentidad1795050401000,
      CrearComercio1795150400000,
      SembrarComercio1795150401000,
      CrearAlertas1795250400000,
      CrearLooks1795250401000,
      CrearLogistica1795250402000,
      CrearPostventa1795250403000,
      SembrarP41795250404000,
      CrearCargasImagenes1795350400000,
      IntegridadComercio1795450400000,
    ],
  };
}

export function crearDataSourceMysql(
  entorno: NodeJS.ProcessEnv = process.env,
): DataSource {
  return new DataSource(opcionesMysql(entorno));
}

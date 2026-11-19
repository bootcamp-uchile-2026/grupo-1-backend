/** Proyecciones explicitas: ningun campo privado de persistencia se publica por accidente. */
import type { CategoriaResponseDto } from '../dto/categoria-response.dto';
import type { ColeccionResponseDto } from '../dto/coleccion-response.dto';
import type { PostResponseDto } from '../dto/post-response.dto';
import type { ProductoResponseDto } from '../dto/producto-response.dto';
import type { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';
import type { VarianteResponseDto } from '../dto/variante-response.dto';
import type { LookResponseDto } from '../dto/look-response.dto';
import type { LookProductoResponseDto } from '../dto/look-response.dto';
import type { UsuarioDetalleResponseDto } from '../dto/usuario-detalle-response.dto';
import type { DireccionResponseDto } from '../dto/direccion-response.dto';
import type { AlertaResponseDto } from '../dto/alerta-response.dto';
import type { CambioDevolucionResponseDto } from '../dto/cambio-devolucion-response.dto';
import type { PedidoResponseDto } from '../dto/pedido-response.dto';
import type { PedidoDetalleResponseDto } from '../dto/pedido-detalle-response.dto';
import type { PedidoItemResponseDto } from '../dto/pedido-detalle-response.dto';
import type {
  Categoria,
  Coleccion,
  Publicacion,
  Producto,
  ProductoDetalle,
  Variante,
  Look,
  LookProducto,
  Usuario,
  Direccion,
  Alerta,
  SolicitudCambioDevolucion,
  PedidoResumen,
  Pedido,
  PedidoItem,
} from '../dominio/modelos';

export function aCategoriaRespuesta(origen: Categoria): CategoriaResponseDto {
  return {
    id: origen.id,
    nombre: origen.nombre,
    slug: origen.slug,
    imagenUrl: origen.imagenUrl,
    destacada: origen.destacada,
  };
}

export function aColeccionRespuesta(origen: Coleccion): ColeccionResponseDto {
  return {
    id: origen.id,
    nombre: origen.nombre,
    descripcion: origen.descripcion,
    imagenUrl: origen.imagenUrl,
  };
}

export function aPublicacionRespuesta(origen: Publicacion): PostResponseDto {
  return {
    id: origen.id,
    titulo: origen.titulo,
    contenido: origen.contenido,
    imagenUrl: origen.imagenUrl,
  };
}

export function aProductoRespuesta(origen: Producto): ProductoResponseDto {
  return {
    id: origen.id,
    nombre: origen.nombre,
    precio: origen.precio,
    imagenUrl: origen.imagenUrl,
    categoria: origen.categoria,
    novedad: origen.novedad,
    oferta: origen.oferta,
  };
}

export function aProductoDetalleRespuesta(
  origen: ProductoDetalle,
): ProductoDetalleResponseDto {
  return {
    id: origen.id,
    nombre: origen.nombre,
    precio: origen.precio,
    imagenUrl: origen.imagenUrl,
    categoria: origen.categoria,
    novedad: origen.novedad,
    oferta: origen.oferta,
    descripcion: origen.descripcion,
    imagenes: [...origen.imagenes],
    calificacion: origen.calificacion,
    colores: [...origen.colores],
    tallas: [...origen.tallas],
    guiaTallas: origen.guiaTallas,
    variantes: origen.variantes.map(aVarianteRespuesta),
  };
}

export function aVarianteRespuesta(origen: Variante): VarianteResponseDto {
  return {
    id: origen.id,
    color: origen.color,
    talla: origen.talla,
    stock: origen.stock,
  };
}

export function aLookRespuesta(origen: Look): LookResponseDto {
  return {
    id: origen.id,
    nombre: origen.nombre,
    productos: origen.productos.map(aLookProductoRespuesta),
    precioTotal: origen.precioTotal,
  };
}

export function aLookProductoRespuesta(
  origen: LookProducto,
): LookProductoResponseDto {
  return {
    productoId: origen.productoId,
    varianteId: origen.varianteId,
  };
}

export function aUsuarioRespuesta(origen: Usuario): UsuarioDetalleResponseDto {
  return {
    id: origen.id,
    nombre: origen.nombre,
    apellido: origen.apellido,
    email: origen.email,
    ...(origen.telefono !== undefined ? { telefono: origen.telefono } : {}),
  };
}

export function aDireccionRespuesta(origen: Direccion): DireccionResponseDto {
  return {
    id: origen.id,
    nombre: origen.nombre,
    calle: origen.calle,
    numero: origen.numero,
    ...(origen.departamento !== undefined
      ? { departamento: origen.departamento }
      : {}),
    comuna: origen.comuna,
    region: origen.region,
    principal: origen.principal,
  };
}

export function aAlertaRespuesta(origen: Alerta): AlertaResponseDto {
  return {
    id: origen.id,
    tipo: origen.tipo,
    productoId: origen.productoId,
    ...(origen.varianteId !== undefined
      ? { varianteId: origen.varianteId }
      : {}),
    ...(origen.precioObjetivo !== undefined
      ? { precioObjetivo: origen.precioObjetivo }
      : {}),
    estado: origen.estado,
  };
}

export function aSolicitudCambioDevolucionRespuesta(
  origen: SolicitudCambioDevolucion,
): CambioDevolucionResponseDto {
  return {
    id: origen.id,
    pedidoId: origen.pedidoId,
    pedidoItemId: origen.pedidoItemId,
    tipo: origen.tipo,
    estado: origen.estado,
    motivo: origen.motivo,
    ...(origen.nuevaVarianteId !== undefined
      ? { nuevaVarianteId: origen.nuevaVarianteId }
      : {}),
    metodoEntrega: origen.metodoEntrega,
    fechaSolicitud: origen.fechaSolicitud,
  };
}

export function aPedidoResumenRespuesta(
  origen: PedidoResumen,
): PedidoResponseDto {
  return {
    id: origen.id,
    numeroPedido: origen.numeroPedido,
    estado: origen.estado,
    fecha: origen.fecha,
    subtotal: origen.subtotal,
    costoEnvio: origen.costoEnvio,
    total: origen.total,
    metodoPago: origen.metodoPago,
  };
}

export function aPedidoRespuesta(
  origen: Omit<Pedido, 'usuarioId' | 'checkout'>,
): PedidoDetalleResponseDto {
  return {
    id: origen.id,
    numeroPedido: origen.numeroPedido,
    estado: origen.estado,
    fecha: origen.fecha,
    subtotal: origen.subtotal,
    costoEnvio: origen.costoEnvio,
    total: origen.total,
    metodoPago: origen.metodoPago,
    items: origen.items.map(aPedidoItemRespuesta),
  };
}

export function aPedidoItemRespuesta(
  origen: PedidoItem,
): PedidoItemResponseDto {
  return {
    id: origen.id,
    productoId: origen.productoId,
    varianteId: origen.varianteId,
    nombre: origen.nombre,
    cantidad: origen.cantidad,
    precioUnitario: origen.precioUnitario,
    subtotal: origen.subtotal,
  };
}

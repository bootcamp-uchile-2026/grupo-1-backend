/** Modelos internos sin decoradores ni dependencias HTTP u ORM. */
import type { EstadoAlerta, TipoAlerta } from './alerta.tipos';
import type { EstadoSolicitud, TipoSolicitud } from './cambio-devolucion.tipos';

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  imagenUrl: string;
  destacada: boolean;
}

export interface Coleccion {
  id: number;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
}

export interface Publicacion {
  id: number;
  titulo: string;
  contenido: string;
  imagenUrl: string;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagenUrl: string;
  categoria: string;
  novedad: boolean;
  oferta: boolean;
}

export interface ProductoDetalle {
  id: number;
  nombre: string;
  precio: number;
  imagenUrl: string;
  categoria: string;
  novedad: boolean;
  oferta: boolean;
  descripcion: string;
  imagenes: string[];
  calificacion: number;
  colores: string[];
  tallas: string[];
  guiaTallas: string;
  variantes: Variante[];
}

export interface Variante {
  id: number;
  color: string;
  talla: string;
  stock: number;
}

export interface Look {
  id: number;
  nombre: string;
  productos: LookProducto[];
  precioTotal: number;
}

export interface LookProducto {
  productoId: number;
  varianteId: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}

export interface Direccion {
  id: number;
  nombre: string;
  calle: string;
  numero: string;
  departamento?: string;
  comuna: string;
  region: string;
  principal: boolean;
}

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  productoId: number;
  varianteId?: number;
  precioObjetivo?: number;
  estado: EstadoAlerta;
}

export interface SolicitudCambioDevolucion {
  id: number;
  pedidoId: number;
  pedidoItemId: number;
  tipo: TipoSolicitud;
  estado: EstadoSolicitud;
  motivo: string;
  nuevaVarianteId?: number;
  metodoEntrega: string;
  fechaSolicitud: string;
}

export interface PedidoResumen {
  id: number;
  numeroPedido: string;
  estado: string;
  fecha: string;
  subtotal: number;
  costoEnvio: number;
  total: number;
  metodoPago: string;
}

export interface Pedido {
  id: number;
  numeroPedido: string;
  estado: string;
  fecha: string;
  subtotal: number;
  costoEnvio: number;
  total: number;
  metodoPago: string;
  items: PedidoItem[];
  usuarioId: number;
  checkout?: SnapshotCheckout;
}

export interface PedidoItem {
  id: number;
  productoId: number;
  varianteId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Contacto de quien recibe, copiado tal como llego al checkout. */
export interface ContactoCheckout {
  nombre: string;
  email: string;
  telefono: string;
}

/**
 * Direccion de despacho copiada del checkout. Es una foto: no referencia a
 * las direcciones del perfil, que el usuario puede cambiar despues.
 */
export interface DireccionCheckout {
  calle: string;
  numero: string;
  departamento?: string;
  comuna: string;
  region: string;
}

/** Copia del checkout que se guarda junto a un pedido creado. */
export interface SnapshotCheckout {
  contacto: ContactoCheckout;
  direccion: DireccionCheckout;
}

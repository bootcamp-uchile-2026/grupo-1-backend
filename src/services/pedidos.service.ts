import { Injectable } from '@nestjs/common';
import {
  ConflictoDominioError,
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores-dominio';
import { CrearPedidoDto } from '../dto/crear-pedido.dto';
import {
  PedidoDetalleResponseDto,
  PedidoItemResponseDto,
} from '../dto/pedido-detalle-response.dto';
import { PedidoResponseDto } from '../dto/pedido-response.dto';
import {
  NuevoPedidoItem,
  PedidosRepository,
} from '../repositorios/pedidos.repository';
import { CarritoService } from './carrito.service';
import { ProductosService } from './productos.service';
import { UsuariosService } from './usuarios.service';

/** Estado con que nace todo pedido creado desde el checkout. */
const ESTADO_INICIAL = 'confirmado';

/**
 * El checkout no recibe modalidad ni tarifa de despacho, asi que no hay con
 * que calcular un costo: por ahora el envio no se cobra.
 */
const COSTO_ENVIO = 0;

/**
 * Pedidos del usuario.
 * Un pedido que no es del usuario de la ruta se trata igual que uno
 * inexistente (404), para no revelar pedidos ajenos.
 */
@Injectable()
export class PedidosService {
  /** Carritos con un checkout en curso, para no convertirlos dos veces. */
  private readonly checkoutsEnCurso = new Set<number>();

  constructor(
    private readonly pedidos: PedidosRepository,
    private readonly usuariosService: UsuariosService,
    private readonly carritoService: CarritoService,
    private readonly productosService: ProductosService,
  ) {}

  /**
   * Convierte un carrito en un pedido del dueno del carrito.
   * Revalida variantes y stock con el catalogo, copia nombre y precio de
   * cada producto en el item y guarda contacto y direccion como foto del
   * checkout. El carrito se vacia solo despues de crear el pedido: si algo
   * falla antes, queda intacto. El stock del catalogo no se descuenta.
   */
  async crearPedido(datos: CrearPedidoDto): Promise<PedidoDetalleResponseDto> {
    if (this.checkoutsEnCurso.has(datos.carritoId)) {
      throw new ConflictoDominioError(
        `El carrito ${datos.carritoId} ya tiene un checkout en curso`,
      );
    }
    this.checkoutsEnCurso.add(datos.carritoId);
    try {
      return await this.carritoService.ejecutarOperacion(datos.carritoId, () =>
        this.convertirCarrito(datos),
      );
    } finally {
      this.checkoutsEnCurso.delete(datos.carritoId);
    }
  }

  private async convertirCarrito(
    datos: CrearPedidoDto,
  ): Promise<PedidoDetalleResponseDto> {
    const carrito = await this.carritoService.obtenerParaCheckout(
      datos.carritoId,
    );
    await this.usuariosService.obtenerUsuario(carrito.usuarioId);
    if (carrito.items.length === 0) {
      throw new ReglaNegocioError('El carrito no tiene items');
    }

    const items: NuevoPedidoItem[] = [];
    for (const linea of carrito.items) {
      const { producto, variante } =
        await this.productosService.obtenerVarianteDeProducto(
          linea.productoId,
          linea.varianteId,
        );
      this.carritoService.comprobarStock(variante, linea.cantidad);
      items.push({
        productoId: producto.id,
        varianteId: variante.id,
        nombre: producto.nombre,
        cantidad: linea.cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * linea.cantidad,
      });
    }
    const subtotal = items.reduce((total, item) => total + item.subtotal, 0);

    const pedido = await this.pedidos.crear({
      usuarioId: carrito.usuarioId,
      estado: ESTADO_INICIAL,
      fecha: new Date().toISOString(),
      subtotal,
      costoEnvio: COSTO_ENVIO,
      total: subtotal + COSTO_ENVIO,
      metodoPago: datos.metodoPago,
      items,
      checkout: {
        contacto: {
          nombre: datos.contacto.nombre,
          email: datos.contacto.email,
          telefono: datos.contacto.telefono,
        },
        direccion: {
          calle: datos.direccion.calle,
          numero: datos.direccion.numero,
          departamento: datos.direccion.departamento ?? undefined,
          comuna: datos.direccion.comuna,
          region: datos.direccion.region,
        },
      },
    });
    try {
      await this.carritoService.vaciarDespuesDeCheckout(carrito.id);
    } catch (error) {
      const eliminado = await this.pedidos.eliminarCreado(
        carrito.usuarioId,
        pedido.id,
      );
      if (!eliminado) throw new Error('No se pudo compensar el checkout');
      await this.carritoService.restaurarDespuesDeCheckout(carrito);
      throw error;
    }
    return pedido;
  }

  /** Devuelve el resumen de los pedidos del usuario. */
  async obtenerPedidos(usuarioId: number): Promise<PedidoResponseDto[]> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const pedidos = await this.pedidos.listarPorUsuario(usuarioId);
    return pedidos.map((pedido) => ({
      id: pedido.id,
      numeroPedido: pedido.numeroPedido,
      estado: pedido.estado,
      fecha: pedido.fecha,
      subtotal: pedido.subtotal,
      costoEnvio: pedido.costoEnvio,
      total: pedido.total,
      metodoPago: pedido.metodoPago,
    }));
  }

  /** Devuelve el detalle de un pedido del usuario, con sus items. */
  async obtenerPedido(
    usuarioId: number,
    pedidoId: number,
  ): Promise<PedidoDetalleResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const pedido = await this.pedidos.buscarDeUsuario(usuarioId, pedidoId);
    if (!pedido) {
      throw new RecursoNoEncontradoError(
        `No existe el pedido con id ${pedidoId}`,
      );
    }
    return pedido;
  }

  /**
   * Devuelve un item comprobando la cadena usuario -> pedido -> item.
   * Lo usa CambiosDevolucionesService antes de registrar una solicitud.
   */
  async obtenerItemDePedido(
    usuarioId: number,
    pedidoId: number,
    pedidoItemId: number,
  ): Promise<PedidoItemResponseDto> {
    const pedido = await this.obtenerPedido(usuarioId, pedidoId);
    const item = pedido.items.find((linea) => linea.id === pedidoItemId);
    if (!item) {
      throw new RecursoNoEncontradoError(
        `El pedido ${pedidoId} no tiene el item ${pedidoItemId}`,
      );
    }
    return item;
  }
}

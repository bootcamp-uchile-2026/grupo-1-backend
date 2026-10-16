import { Injectable } from '@nestjs/common';
import {
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores-dominio';
import { ActualizarCantidadDto } from '../dto/actualizar-cantidad.dto';
import { AgregarItemCarritoDto } from '../dto/agregar-item-carrito.dto';
import { CarritoResponseDto } from '../dto/carrito-response.dto';
import { ItemCarritoResponseDto } from '../dto/item-carrito-response.dto';
import { VarianteResponseDto } from '../dto/variante-response.dto';
import {
  CarritoPersistido,
  CarritosRepository,
} from '../repositorios/carritos.repository';
import { ProductosService } from './productos.service';
import { UsuariosService } from './usuarios.service';

/**
 * Carrito de compras de StyleNow.
 * El carrito guarda solo variante y cantidad; nombre, imagen, talla, color
 * y precio se leen del catalogo vigente en cada respuesta. La cantidad de
 * una variante nunca puede superar su stock.
 */
@Injectable()
export class CarritoService {
  /** Colas independientes: las escrituras y el checkout no se pisan. */
  private readonly operaciones = new Map<number, Promise<void>>();

  constructor(
    private readonly carritos: CarritosRepository,
    private readonly usuariosService: UsuariosService,
    private readonly productosService: ProductosService,
  ) {}

  /** Crea el carrito vacio de un usuario recien registrado. */
  async crearCarrito(usuarioId: number): Promise<void> {
    await this.carritos.crearParaUsuario(usuarioId);
  }

  /** Devuelve el carrito actual del usuario. */
  async obtenerCarrito(usuarioId: number): Promise<CarritoResponseDto> {
    const carrito = await this.carritoDeUsuario(usuarioId);
    return this.aRespuesta(carrito);
  }

  /**
   * Agrega una variante al carrito. Si la variante ya estaba, suma la
   * cantidad a la linea existente.
   */
  async agregarItem(
    usuarioId: number,
    datos: AgregarItemCarritoDto,
  ): Promise<CarritoResponseDto> {
    const carrito = await this.carritoDeUsuario(usuarioId);
    return this.ejecutarOperacion(carrito.id, async () => {
      const vigente = await this.buscarPorId(carrito.id);
      const { variante } = await this.productosService.obtenerVariante(
        datos.varianteId,
      );
      const actual =
        vigente.items.find((item) => item.varianteId === variante.id)
          ?.cantidad ?? 0;
      const cantidad = actual + datos.cantidad;
      this.comprobarStock(variante, cantidad);
      return this.guardar(carrito.id, variante.id, cantidad);
    });
  }

  /** Reemplaza la cantidad de una linea existente del carrito. */
  async actualizarCantidad(
    usuarioId: number,
    varianteId: number,
    datos: ActualizarCantidadDto,
  ): Promise<CarritoResponseDto> {
    const carrito = await this.carritoDeUsuario(usuarioId);
    return this.ejecutarOperacion(carrito.id, async () => {
      this.comprobarLinea(await this.buscarPorId(carrito.id), varianteId);
      const { variante } =
        await this.productosService.obtenerVariante(varianteId);
      this.comprobarStock(variante, datos.cantidad);
      return this.guardar(carrito.id, variante.id, datos.cantidad);
    });
  }

  /** Quita una linea del carrito y devuelve el carrito recalculado. */
  async eliminarItem(
    usuarioId: number,
    varianteId: number,
  ): Promise<CarritoResponseDto> {
    const carrito = await this.carritoDeUsuario(usuarioId);
    return this.ejecutarOperacion(carrito.id, async () => {
      this.comprobarLinea(await this.buscarPorId(carrito.id), varianteId);
      const eliminado = await this.carritos.eliminarItem(
        carrito.id,
        varianteId,
      );
      if (!eliminado) {
        throw new RecursoNoEncontradoError(
          `El carrito no tiene la variante ${varianteId}`,
        );
      }
      return this.obtenerCarrito(usuarioId);
    });
  }

  /** Coordina una operacion completa por id, sin bloquear otros carritos. */
  async ejecutarOperacion<T>(
    carritoId: number,
    operacion: () => Promise<T>,
  ): Promise<T> {
    const anterior = this.operaciones.get(carritoId) ?? Promise.resolve();
    const resultado = anterior.then(operacion);
    const cola = resultado.then(
      () => undefined,
      () => undefined,
    );
    this.operaciones.set(carritoId, cola);
    try {
      return await resultado;
    } finally {
      if (this.operaciones.get(carritoId) === cola) {
        this.operaciones.delete(carritoId);
      }
    }
  }

  /**
   * Uso interno de PedidosService: carrito completo, con precios del
   * catalogo vigente, a partir de su id.
   */
  async obtenerParaCheckout(carritoId: number): Promise<CarritoResponseDto> {
    const carrito = await this.buscarPorId(carritoId);
    return this.aRespuesta(carrito);
  }

  /** Uso interno de PedidosService: vacia el carrito tras crear el pedido. */
  async vaciarDespuesDeCheckout(carritoId: number): Promise<void> {
    const vaciado = await this.carritos.vaciar(carritoId);
    if (!vaciado) throw new Error('No se pudo vaciar el carrito del checkout');
  }

  /** Compensa incluso un vaciado que fallo despues de modificar el carrito. */
  async restaurarDespuesDeCheckout(carrito: CarritoResponseDto): Promise<void> {
    const restaurado = await this.carritos.restaurarItems(
      carrito.id,
      carrito.items.map(({ varianteId, cantidad }) => ({
        varianteId,
        cantidad,
      })),
    );
    if (!restaurado) throw new Error('No se pudo restaurar el carrito');
  }

  /**
   * Regla de stock del carrito y del checkout: la variante debe tener stock
   * y la cantidad total pedida no puede superarlo.
   */
  comprobarStock(variante: VarianteResponseDto, cantidad: number): void {
    if (variante.stock <= 0) {
      throw new ReglaNegocioError(
        `La variante ${variante.id} no tiene stock disponible`,
      );
    }
    if (cantidad > variante.stock) {
      throw new ReglaNegocioError(
        `La variante ${variante.id} tiene ${variante.stock} unidades disponibles y se pidieron ${cantidad}`,
      );
    }
  }

  private async carritoDeUsuario(
    usuarioId: number,
  ): Promise<CarritoPersistido> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const carrito = await this.carritos.buscarPorUsuario(usuarioId);
    if (!carrito) {
      throw new RecursoNoEncontradoError(
        `El usuario ${usuarioId} no tiene carrito`,
      );
    }
    return carrito;
  }

  private async buscarPorId(carritoId: number): Promise<CarritoPersistido> {
    const carrito = await this.carritos.buscarPorId(carritoId);
    if (!carrito) {
      throw new RecursoNoEncontradoError(
        `No existe el carrito con id ${carritoId}`,
      );
    }
    return carrito;
  }

  private comprobarLinea(carrito: CarritoPersistido, varianteId: number): void {
    if (!carrito.items.some((item) => item.varianteId === varianteId)) {
      throw new RecursoNoEncontradoError(
        `El carrito no tiene la variante ${varianteId}`,
      );
    }
  }

  private async guardar(
    carritoId: number,
    varianteId: number,
    cantidad: number,
  ): Promise<CarritoResponseDto> {
    const carrito = await this.carritos.guardarCantidad(
      carritoId,
      varianteId,
      cantidad,
    );
    if (!carrito) {
      throw new RecursoNoEncontradoError(
        `No existe el carrito con id ${carritoId}`,
      );
    }
    return this.aRespuesta(carrito);
  }

  /** Arma la respuesta con los datos vigentes del catalogo. */
  private async aRespuesta(
    carrito: CarritoPersistido,
  ): Promise<CarritoResponseDto> {
    const items: ItemCarritoResponseDto[] = [];
    for (const linea of carrito.items) {
      const { producto, variante } =
        await this.productosService.obtenerVariante(linea.varianteId);
      items.push({
        productoId: producto.id,
        varianteId: variante.id,
        nombre: producto.nombre,
        imagenUrl: producto.imagenUrl,
        talla: variante.talla,
        color: variante.color,
        precioUnitario: producto.precio,
        cantidad: linea.cantidad,
        subtotal: producto.precio * linea.cantidad,
      });
    }
    return {
      id: carrito.id,
      usuarioId: carrito.usuarioId,
      items,
      cantidadTotal: items.reduce((total, item) => total + item.cantidad, 0),
      subtotal: items.reduce((total, item) => total + item.subtotal, 0),
    };
  }
}

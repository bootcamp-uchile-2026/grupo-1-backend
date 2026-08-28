import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActualizarCantidadDto } from '../dto/actualizar-cantidad.dto';
import { AgregarItemCarritoDto } from '../dto/agregar-item-carrito.dto';
import { CarritoResponseDto } from '../dto/carrito-response.dto';
import { ItemCarritoResponseDto } from '../dto/item-carrito-response.dto';
import { AuthService } from './auth.service';
import { ProductosService } from './productos.service';

/** Linea del carrito tal como se guarda en memoria. */
interface LineaCarrito {
  varianteId: number;
  cantidad: number;
}

/**
 * Carrito de compras de StyleNow.
 * En Hito 1 los carritos viven en memoria, en un Map indexado por usuario.
 * Todos los metodos devuelven el carrito completo y recalculado para que
 * el frontend actualice el icono del header con una sola respuesta.
 */
@Injectable()
export class CarritoService {
  private readonly carritos = new Map<number, LineaCarrito[]>();

  constructor(
    private readonly productosService: ProductosService,
    private readonly authService: AuthService,
  ) {}

  /** Devuelve el carrito actual del usuario. Si nunca compro, viene vacio. */
  obtenerCarrito(usuarioId: string): CarritoResponseDto {
    const id = this.authService.obtenerUsuarioPorId(usuarioId).id;
    return this.construirRespuesta(id, this.lineasDe(id));
  }

  /**
   * Agrega una variante al carrito.
   * Si la variante ya estaba, suma la cantidad a la linea existente.
   */
  agregarItem(
    usuarioId: string,
    dto: AgregarItemCarritoDto,
  ): CarritoResponseDto {
    const id = this.authService.obtenerUsuarioPorId(usuarioId).id;
    const varianteId = this.aEnteroPositivo(dto?.varianteId, 'varianteId');
    const cantidad = this.aEnteroPositivo(dto?.cantidad, 'cantidad');

    const { variante } = this.productosService.obtenerVariante(varianteId);
    const lineas = this.lineasDe(id);
    const existente = lineas.find((linea) => linea.varianteId === varianteId);
    const cantidadFinal = (existente?.cantidad ?? 0) + cantidad;

    if (cantidadFinal > variante.stock) {
      throw new BadRequestException(
        `Stock insuficiente. Quedan ${variante.stock} unidades disponibles`,
      );
    }

    if (existente) {
      existente.cantidad = cantidadFinal;
    } else {
      lineas.push({ varianteId, cantidad });
    }
    this.carritos.set(id, lineas);
    return this.construirRespuesta(id, lineas);
  }

  /** Reemplaza la cantidad de una linea que ya esta en el carrito. */
  actualizarCantidad(
    usuarioId: string,
    varianteId: string,
    dto: ActualizarCantidadDto,
  ): CarritoResponseDto {
    const id = this.authService.obtenerUsuarioPorId(usuarioId).id;
    const idVariante = this.aEnteroPositivo(varianteId, 'varianteId');
    const cantidad = this.aEnteroPositivo(dto?.cantidad, 'cantidad');

    const lineas = this.lineasDe(id);
    const linea = lineas.find((item) => item.varianteId === idVariante);
    if (!linea) {
      throw new NotFoundException(
        `La variante ${idVariante} no esta en el carrito`,
      );
    }

    const { variante } = this.productosService.obtenerVariante(idVariante);
    if (cantidad > variante.stock) {
      throw new BadRequestException(
        `Stock insuficiente. Quedan ${variante.stock} unidades disponibles`,
      );
    }

    linea.cantidad = cantidad;
    this.carritos.set(id, lineas);
    return this.construirRespuesta(id, lineas);
  }

  /** Quita una linea del carrito y devuelve el carrito recalculado. */
  eliminarItem(usuarioId: string, varianteId: string): CarritoResponseDto {
    const id = this.authService.obtenerUsuarioPorId(usuarioId).id;
    const idVariante = this.aEnteroPositivo(varianteId, 'varianteId');

    const lineas = this.lineasDe(id);
    const posicion = lineas.findIndex((item) => item.varianteId === idVariante);
    if (posicion === -1) {
      throw new NotFoundException(
        `La variante ${idVariante} no esta en el carrito`,
      );
    }

    lineas.splice(posicion, 1);
    this.carritos.set(id, lineas);
    return this.construirRespuesta(id, lineas);
  }

  private lineasDe(usuarioId: number): LineaCarrito[] {
    return this.carritos.get(usuarioId) ?? [];
  }

  /** Arma la respuesta del carrito con los precios y totales calculados. */
  private construirRespuesta(
    usuarioId: number,
    lineas: LineaCarrito[],
  ): CarritoResponseDto {
    const items: ItemCarritoResponseDto[] = lineas.map((linea) => {
      const { producto, variante } = this.productosService.obtenerVariante(
        linea.varianteId,
      );
      return {
        productoId: producto.id,
        varianteId: variante.id,
        nombre: producto.nombre,
        imagenUrl: producto.imagenUrl,
        talla: variante.talla,
        color: variante.color,
        precioUnitario: producto.precio,
        cantidad: linea.cantidad,
        subtotal: producto.precio * linea.cantidad,
      };
    });

    return {
      usuarioId,
      items,
      cantidadTotal: items.reduce((total, item) => total + item.cantidad, 0),
      subtotal: items.reduce((total, item) => total + item.subtotal, 0),
    };
  }

  private aEnteroPositivo(
    valor: string | number | undefined,
    campo: string,
  ): number {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1) {
      throw new BadRequestException(
        `${campo} debe ser un entero mayor que cero`,
      );
    }
    return numero;
  }
}

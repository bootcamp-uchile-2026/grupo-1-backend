import { Injectable } from '@nestjs/common';
import {
  RecursoNoEncontradoError,
  ReglaNegocioError,
} from '../dominio/errores-dominio';
import {
  FiltrarProductosDto,
  OrdenProducto,
} from '../dto/filtrar-productos.dto';
import { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';
import { ProductoResponseDto } from '../dto/producto-response.dto';
import { ProductosPaginadosResponseDto } from '../dto/productos-paginados-response.dto';
import {
  ProductosRepository,
  VarianteConProducto,
} from '../repositorios/productos.repository';

/**
 * Catalogo de StyleNow.
 * Los datos vienen de ProductosRepository. Los demas dominios validan sus
 * referencias al catalogo a traves de este servicio.
 */
/** Paginacion por defecto cuando el llamador no la indica. */
const PAGINA_POR_DEFECTO = 1;
const LIMITE_POR_DEFECTO = 12;

/** Comparadores de cada criterio de orden. El empate se resuelve por id. */
const COMPARADORES: Record<
  OrdenProducto,
  (a: ProductoDetalleResponseDto, b: ProductoDetalleResponseDto) => number
> = {
  relevancia: (a, b) => a.id - b.id,
  precio_asc: (a, b) => a.precio - b.precio || a.id - b.id,
  precio_desc: (a, b) => b.precio - a.precio || a.id - b.id,
  nombre_asc: (a, b) => a.nombre.localeCompare(b.nombre, 'es') || a.id - b.id,
};

@Injectable()
export class ProductosService {
  constructor(private readonly productos: ProductosRepository) {}

  /**
   * Devuelve la pagina del catalogo que corresponde a los filtros recibidos.
   * Los filtros se combinan con AND; despues se ordena y por ultimo se pagina.
   * total cuenta los productos que cumplen los filtros, no los de la pagina.
   */
  async obtenerProductos(
    filtros: FiltrarProductosDto,
  ): Promise<ProductosPaginadosResponseDto> {
    const { precioMin, precioMax } = filtros;
    if (
      precioMin !== undefined &&
      precioMax !== undefined &&
      precioMin > precioMax
    ) {
      throw new ReglaNegocioError('precioMin no puede ser mayor que precioMax');
    }

    const pagina = filtros.pagina ?? PAGINA_POR_DEFECTO;
    const limite = filtros.limite ?? LIMITE_POR_DEFECTO;
    const catalogo = await this.productos.listar();
    const filtrados = catalogo
      .filter((producto) => this.cumpleFiltros(producto, filtros))
      .sort(COMPARADORES[filtros.orden ?? 'relevancia']);
    const inicio = (pagina - 1) * limite;

    return {
      productos: filtrados
        .slice(inicio, inicio + limite)
        .map((producto) => this.aResumen(producto)),
      pagina,
      limite,
      total: filtrados.length,
    };
  }

  /** Devuelve el detalle de un producto concreto. */
  async obtenerProductoPorId(
    productoId: number,
  ): Promise<ProductoDetalleResponseDto> {
    const producto = await this.productos.buscarPorId(productoId);
    if (!producto) {
      throw new RecursoNoEncontradoError(
        `No existe el producto con id ${productoId}`,
      );
    }
    return producto;
  }

  /** Busca una variante en todo el catalogo y devuelve tambien su producto. */
  async obtenerVariante(varianteId: number): Promise<VarianteConProducto> {
    const encontrada = await this.productos.buscarVariante(varianteId);
    if (!encontrada) {
      throw new RecursoNoEncontradoError(
        `No existe la variante con id ${varianteId}`,
      );
    }
    return encontrada;
  }

  /**
   * Devuelve una variante comprobando que pertenece al producto indicado.
   * Es la validacion que usan looks, alertas y cambios para sus referencias.
   */
  async obtenerVarianteDeProducto(
    productoId: number,
    varianteId: number,
  ): Promise<VarianteConProducto> {
    const producto = await this.obtenerProductoPorId(productoId);
    const variante = producto.variantes.find((item) => item.id === varianteId);
    if (!variante) {
      throw new RecursoNoEncontradoError(
        `El producto ${productoId} no tiene la variante ${varianteId}`,
      );
    }
    return { producto, variante };
  }

  private cumpleFiltros(
    producto: ProductoDetalleResponseDto,
    filtros: FiltrarProductosDto,
  ): boolean {
    const { search, categoria, talla, color, precioMin, precioMax } = filtros;
    const texto = this.normalizar(search);
    if (
      texto &&
      !this.normalizar(producto.nombre).includes(texto) &&
      !this.normalizar(producto.descripcion).includes(texto)
    ) {
      return false;
    }
    if (
      categoria !== undefined &&
      this.normalizar(producto.categoria) !== this.normalizar(categoria)
    ) {
      return false;
    }
    if (precioMin !== undefined && producto.precio < precioMin) return false;
    if (precioMax !== undefined && producto.precio > precioMax) return false;
    if (filtros.novedad !== undefined && producto.novedad !== filtros.novedad) {
      return false;
    }
    if (filtros.oferta !== undefined && producto.oferta !== filtros.oferta) {
      return false;
    }
    if (talla !== undefined || color !== undefined) {
      // Talla y color se exigen a una misma variante que ademas tenga stock.
      return producto.variantes.some(
        (variante) =>
          variante.stock > 0 &&
          (talla === undefined ||
            this.normalizar(variante.talla) === this.normalizar(talla)) &&
          (color === undefined ||
            this.normalizar(variante.color) === this.normalizar(color)),
      );
    }
    return true;
  }

  /** Minusculas, sin tildes y sin espacios en los extremos. */
  private normalizar(valor?: string): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  /** El listado expone solo los campos de tarjeta, no los de la ficha. */
  private aResumen(producto: ProductoDetalleResponseDto): ProductoResponseDto {
    return {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagenUrl: producto.imagenUrl,
      categoria: producto.categoria,
      novedad: producto.novedad,
      oferta: producto.oferta,
    };
  }
}

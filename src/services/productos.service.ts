import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FiltrarProductosDto } from '../dto/filtrar-productos.dto';
import { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';
import { ProductoResponseDto } from '../dto/producto-response.dto';
import { ProductosPaginadosResponseDto } from '../dto/productos-paginados-response.dto';
import { VarianteResponseDto } from '../dto/variante-response.dto';

/** Ordenamientos aceptados por el catalogo. */
const ORDENES_VALIDOS = [
  'relevancia',
  'precio_asc',
  'precio_desc',
  'nombre_asc',
];

/** Guia de tallas unica para Hito 1. */
const GUIA_TALLAS = 'https://www.stylenow.cl/ayuda/guia-de-tallas';

/**
 * Logica del catalogo de StyleNow.
 * En Hito 1 los productos viven en memoria dentro de este servicio.
 */
@Injectable()
export class ProductosService {
  private readonly productos: ProductoDetalleResponseDto[] = [
    this.crear(
      1,
      'Vestido de lino',
      29990,
      'mujer',
      true,
      false,
      4.5,
      ['Beige', 'Negro'],
      ['S', 'M', 'L'],
    ),
    this.crear(
      2,
      'Blusa manga larga',
      19990,
      'mujer',
      true,
      false,
      4.2,
      ['Blanco', 'Verde'],
      ['S', 'M', 'L'],
    ),
    this.crear(
      3,
      'Jeans rectos',
      32990,
      'mujer',
      false,
      true,
      4.7,
      ['Azul', 'Negro'],
      ['36', '38', '40'],
    ),
    this.crear(
      4,
      'Blazer clasico',
      45990,
      'mujer',
      false,
      false,
      4.4,
      ['Beige', 'Negro'],
      ['S', 'M', 'L'],
    ),
    this.crear(
      5,
      'Polera basica',
      12990,
      'hombre',
      true,
      false,
      4.1,
      ['Blanco', 'Gris'],
      ['S', 'M', 'L', 'XL'],
    ),
    this.crear(
      6,
      'Camisa oxford',
      27990,
      'hombre',
      false,
      true,
      4.6,
      ['Celeste', 'Blanco'],
      ['S', 'M', 'L'],
    ),
    this.crear(
      7,
      'Parka impermeable',
      59990,
      'hombre',
      false,
      false,
      4.8,
      ['Negro', 'Verde'],
      ['M', 'L', 'XL'],
    ),
    this.crear(
      8,
      'Zapatilla urbana',
      39990,
      'calzado',
      true,
      false,
      4.3,
      ['Blanco', 'Negro'],
      ['39', '40', '41'],
    ),
    this.crear(
      9,
      'Bolso compacto',
      24990,
      'accesorios',
      false,
      true,
      4.0,
      ['Cafe', 'Negro'],
      ['Unica'],
    ),
    this.crear(
      10,
      'Cinturon de cuero',
      15990,
      'accesorios',
      false,
      false,
      4.2,
      ['Cafe', 'Negro'],
      ['Unica'],
    ),
  ];

  /**
   * Devuelve la pagina del catalogo que corresponde a los filtros recibidos.
   * Resuelve el listado, el buscador del header, la nueva coleccion y las ofertas.
   */
  obtenerProductos(
    filtros: FiltrarProductosDto,
  ): ProductosPaginadosResponseDto {
    const search = this.normalizar(filtros.search);
    const categoria = this.normalizar(filtros.categoria);
    const talla = this.normalizar(filtros.talla);
    const color = this.normalizar(filtros.color);
    const precioMin = this.aNumero(filtros.precioMin, 'precioMin');
    const precioMax = this.aNumero(filtros.precioMax, 'precioMax');
    const novedad = this.aBooleano(filtros.novedad, 'novedad');
    const oferta = this.aBooleano(filtros.oferta, 'oferta');
    const pagina = this.aEnteroPositivo(filtros.pagina, 'pagina', 1);
    const limite = this.aEnteroPositivo(filtros.limite, 'limite', 12);

    if (limite > 50) {
      throw new BadRequestException('limite no puede ser mayor que 50');
    }
    if (
      precioMin !== undefined &&
      precioMax !== undefined &&
      precioMin > precioMax
    ) {
      throw new BadRequestException(
        'precioMin no puede ser mayor que precioMax',
      );
    }

    let encontrados = [...this.productos];

    if (search) {
      encontrados = encontrados.filter((producto) =>
        this.normalizar(`${producto.nombre} ${producto.descripcion}`).includes(
          search,
        ),
      );
    }
    if (categoria) {
      encontrados = encontrados.filter(
        (producto) => this.normalizar(producto.categoria) === categoria,
      );
    }
    if (talla) {
      encontrados = encontrados.filter((producto) =>
        producto.variantes.some(
          (variante) =>
            this.normalizar(variante.talla) === talla && variante.stock > 0,
        ),
      );
    }
    if (color) {
      encontrados = encontrados.filter((producto) =>
        producto.variantes.some(
          (variante) =>
            this.normalizar(variante.color) === color && variante.stock > 0,
        ),
      );
    }
    if (precioMin !== undefined) {
      encontrados = encontrados.filter(
        (producto) => producto.precio >= precioMin,
      );
    }
    if (precioMax !== undefined) {
      encontrados = encontrados.filter(
        (producto) => producto.precio <= precioMax,
      );
    }
    if (novedad !== undefined) {
      encontrados = encontrados.filter(
        (producto) => producto.novedad === novedad,
      );
    }
    if (oferta !== undefined) {
      encontrados = encontrados.filter(
        (producto) => producto.oferta === oferta,
      );
    }

    encontrados = this.ordenar(encontrados, filtros.orden);
    const desde = (pagina - 1) * limite;

    return {
      productos: encontrados
        .slice(desde, desde + limite)
        .map((producto) => this.aTarjeta(producto)),
      pagina,
      limite,
      total: encontrados.length,
    };
  }

  /** Devuelve la ficha completa de un producto. */
  obtenerProductoPorId(id: string | number): ProductoDetalleResponseDto {
    const productoId = this.aId(id, 'id');
    const producto = this.productos.find((item) => item.id === productoId);
    if (!producto) {
      throw new NotFoundException(`No existe el producto con id ${productoId}`);
    }
    return this.copiar(producto);
  }

  /**
   * Busca una variante concreta dentro del catalogo.
   * Lo usa CarritoService para conocer precio, nombre, talla, color y stock.
   */
  obtenerVariante(varianteId: number): {
    producto: ProductoDetalleResponseDto;
    variante: VarianteResponseDto;
  } {
    for (const producto of this.productos) {
      const variante = producto.variantes.find(
        (item) => item.id === varianteId,
      );
      if (variante) {
        return { producto, variante };
      }
    }
    throw new NotFoundException(`No existe la variante con id ${varianteId}`);
  }

  /** Arma un producto de ejemplo con sus variantes de color y talla. */
  private crear(
    id: number,
    nombre: string,
    precio: number,
    categoria: string,
    novedad: boolean,
    oferta: boolean,
    calificacion: number,
    colores: string[],
    tallas: string[],
  ): ProductoDetalleResponseDto {
    const base = nombre.toLowerCase().replace(/ /g, '-');
    const imagenUrl = `https://cdn.stylenow.cl/productos/${base}.jpg`;
    let secuencia = id * 100;
    const variantes: VarianteResponseDto[] = [];
    for (const color of colores) {
      for (const talla of tallas) {
        secuencia += 1;
        variantes.push({
          id: secuencia,
          color,
          talla,
          stock: 5 + (secuencia % 6),
        });
      }
    }
    return {
      id,
      nombre,
      precio,
      imagenUrl,
      categoria,
      novedad,
      oferta,
      descripcion: `${nombre} de la temporada StyleNow, pensado para combinar comodidad y estilo.`,
      imagenes: [imagenUrl, `https://cdn.stylenow.cl/productos/${base}-2.jpg`],
      calificacion,
      colores,
      tallas,
      guiaTallas: GUIA_TALLAS,
      variantes,
    };
  }

  /** Reduce la ficha a los datos que necesita una tarjeta del catalogo. */
  private aTarjeta(producto: ProductoDetalleResponseDto): ProductoResponseDto {
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

  /** Entrega una copia para que el dato en memoria no se modifique desde fuera. */
  private copiar(
    producto: ProductoDetalleResponseDto,
  ): ProductoDetalleResponseDto {
    return {
      ...producto,
      imagenes: [...producto.imagenes],
      colores: [...producto.colores],
      tallas: [...producto.tallas],
      variantes: producto.variantes.map((variante) => ({ ...variante })),
    };
  }

  private ordenar(
    productos: ProductoDetalleResponseDto[],
    orden?: string,
  ): ProductoDetalleResponseDto[] {
    const criterio = orden ?? 'relevancia';
    if (!ORDENES_VALIDOS.includes(criterio)) {
      throw new BadRequestException(
        `orden debe ser uno de: ${ORDENES_VALIDOS.join(', ')}`,
      );
    }
    if (criterio === 'precio_asc') {
      return productos.sort((a, b) => a.precio - b.precio);
    }
    if (criterio === 'precio_desc') {
      return productos.sort((a, b) => b.precio - a.precio);
    }
    if (criterio === 'nombre_asc') {
      return productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }
    return productos;
  }

  /** Deja el texto en minusculas y sin tildes para comparar filtros. */
  private normalizar(valor?: string): string {
    return (valor ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private aBooleano(
    valor: string | undefined,
    campo: string,
  ): boolean | undefined {
    if (valor === undefined || valor === '') return undefined;
    if (valor === 'true') return true;
    if (valor === 'false') return false;
    throw new BadRequestException(`${campo} debe ser true o false`);
  }

  private aNumero(
    valor: string | undefined,
    campo: string,
  ): number | undefined {
    if (valor === undefined || valor === '') return undefined;
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) {
      throw new BadRequestException(
        `${campo} debe ser un numero mayor o igual que cero`,
      );
    }
    return numero;
  }

  private aEnteroPositivo(
    valor: string | undefined,
    campo: string,
    porDefecto: number,
  ): number {
    if (valor === undefined || valor === '') return porDefecto;
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1) {
      throw new BadRequestException(
        `${campo} debe ser un entero mayor que cero`,
      );
    }
    return numero;
  }

  private aId(valor: string | number, campo: string): number {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1) {
      throw new BadRequestException(
        `${campo} debe ser un entero mayor que cero`,
      );
    }
    return numero;
  }
}

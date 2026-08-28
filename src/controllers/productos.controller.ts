import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FiltrarProductosDto } from '../dto/filtrar-productos.dto';
import { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';
import { ProductosPaginadosResponseDto } from '../dto/productos-paginados-response.dto';
import { ProductosService } from '../services/productos.service';

/**
 * Recurso Productos.
 * Un unico recurso resuelve el catalogo, el buscador del header, la nueva
 * coleccion, las ofertas y la ficha de producto. Cada pantalla del wireframe
 * es una combinacion distinta de query params, no un endpoint distinto.
 */
@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @ApiOperation({
    summary: 'Lista el catalogo de productos con filtros opcionales',
    description:
      'Devuelve la pagina solicitada del catalogo. Sin filtros entrega el catalogo completo. ' +
      'Este mismo endpoint resuelve el buscador del header (search), la navegacion por ' +
      'categoria (categoria), el bloque Nueva coleccion de la home (novedad=true), la seccion ' +
      'Ofertas (oferta=true) y los filtros de talla, color, precio y orden del catalogo.',
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
    description:
      'Texto del buscador del header. Busca en el nombre y la descripcion.',
    example: 'vestido',
  })
  @ApiQuery({
    name: 'categoria',
    type: String,
    required: false,
    description: 'Slug de categoria obtenido desde GET /categorias.',
    example: 'mujer',
  })
  @ApiQuery({
    name: 'talla',
    type: String,
    required: false,
    description: 'Talla con stock disponible en alguna variante del producto.',
    example: 'M',
  })
  @ApiQuery({
    name: 'color',
    type: String,
    required: false,
    description: 'Color con stock disponible en alguna variante del producto.',
    example: 'Beige',
  })
  @ApiQuery({
    name: 'precioMin',
    type: Number,
    required: false,
    description: 'Precio minimo en pesos chilenos.',
    example: 10000,
  })
  @ApiQuery({
    name: 'precioMax',
    type: Number,
    required: false,
    description: 'Precio maximo en pesos chilenos.',
    example: 40000,
  })
  @ApiQuery({
    name: 'novedad',
    type: Boolean,
    required: false,
    description: 'true devuelve solo los productos de la nueva coleccion.',
    example: true,
  })
  @ApiQuery({
    name: 'oferta',
    type: Boolean,
    required: false,
    description: 'true devuelve solo los productos de la seccion Ofertas.',
    example: true,
  })
  @ApiQuery({
    name: 'orden',
    required: false,
    enum: ['relevancia', 'precio_asc', 'precio_desc', 'nombre_asc'],
    description:
      'Criterio de ordenamiento del listado. Por defecto relevancia.',
    example: 'precio_asc',
  })
  @ApiQuery({
    name: 'pagina',
    type: Number,
    required: false,
    description: 'Pagina solicitada. Comienza en 1. Por defecto 1.',
    example: 1,
  })
  @ApiQuery({
    name: 'limite',
    type: Number,
    required: false,
    description: 'Productos por pagina. Por defecto 12 y como maximo 50.',
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Catalogo obtenido correctamente.',
    type: ProductosPaginadosResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Algun filtro tiene un formato invalido, por ejemplo precioMin mayor que precioMax.',
  })
  @Get()
  obtenerProductos(
    @Query() filtros: FiltrarProductosDto,
  ): ProductosPaginadosResponseDto {
    return this.productosService.obtenerProductos(filtros);
  }

  @ApiOperation({
    summary: 'Obtiene la ficha de un producto',
    description:
      'Devuelve todo lo que muestra la ficha de producto: galeria de imagenes, descripcion, ' +
      'calificacion, colores, tallas, guia de tallas y las variantes con su stock. ' +
      'El id de la variante elegida es el que se envia luego al carrito.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    required: true,
    description: 'Identificador del producto obtenido desde GET /productos.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado.',
    type: ProductoDetalleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El id no es un entero mayor que cero.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un producto con ese id.',
  })
  @Get(':id')
  obtenerProductoPorId(@Param('id') id: string): ProductoDetalleResponseDto {
    return this.productosService.obtenerProductoPorId(id);
  }
}

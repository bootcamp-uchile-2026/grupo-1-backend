import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
      'Ofertas (oferta=true) y los filtros de talla, color, precio y orden del catalogo. ' +
      'Los filtros se combinan con AND. Una busqueda sin coincidencias o una pagina ' +
      'fuera de rango responden 200 con productos vacio.',
  })
  @ApiResponse({
    status: 200,
    description: 'Catalogo obtenido correctamente.',
    type: ProductosPaginadosResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Algun filtro tiene un formato invalido, se envio un parametro no declarado ' +
      'o precioMin es mayor que precioMax.',
  })
  @Get()
  async obtenerProductos(
    @Query() filtros: FiltrarProductosDto,
  ): Promise<ProductosPaginadosResponseDto> {
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
    description: 'El id no es un numero entero.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un producto con ese id.',
  })
  @Get(':id')
  async obtenerProductoPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductoDetalleResponseDto> {
    return this.productosService.obtenerProductoPorId(id);
  }
}

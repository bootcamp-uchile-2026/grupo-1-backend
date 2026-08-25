import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { FiltrarProductosDto } from './dto/filtrar-productos.dto';
import { ProductoResponseDto } from './dto/producto-response.dto';
import { ProductoDetalleResponseDto } from './dto/producto-detalle-response.dto';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @ApiOperation({
    summary: 'Obtiene el catalogo de productos con filtros opcionales',
    description:
      'Un unico endpoint resuelve el listado, la busqueda del header y la navegacion ' +
      'por genero, categoria, novedades y ofertas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Productos obtenidos correctamente',
    type: ProductoResponseDto,
    isArray: true,
  })
  @Get()
  obtenerProductos(@Query() filtros: FiltrarProductosDto) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }

  @ApiOperation({
    summary: 'Obtiene la ficha de un producto',
    description:
      'Incluye descripcion, galeria de imagenes y variantes con talla, color y stock.',
  })
  @ApiParam({
    name: 'id',
    example: 12,
    description: 'Identificador del producto',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    type: ProductoDetalleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Get(':id')
  obtenerProductoPorId(@Param('id') id: string) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }
}

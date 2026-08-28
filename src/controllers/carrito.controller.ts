import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActualizarCantidadDto } from '../dto/actualizar-cantidad.dto';
import { AgregarItemCarritoDto } from '../dto/agregar-item-carrito.dto';
import { CarritoResponseDto } from '../dto/carrito-response.dto';
import { CarritoService } from '../services/carrito.service';

/**
 * Recurso Carrito.
 * El carrito siempre pertenece a un usuario, por eso la ruta es anidada:
 * /usuarios/{usuarioId}/carrito. Las lineas se identifican por varianteId
 * porque la ficha obliga a elegir color y talla antes de agregar.
 * Todos los endpoints devuelven el carrito completo y recalculado.
 */
@ApiTags('carrito')
@Controller('usuarios/:usuarioId/carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @ApiOperation({
    summary: 'Obtiene el carrito del usuario',
    description:
      'Devuelve las lineas actuales del carrito con sus subtotales, la cantidad total de ' +
      'unidades y el subtotal general. Si el usuario aun no agrega nada, items viene vacio.',
  })
  @ApiParam({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'Identificador del usuario dueno del carrito.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito obtenido correctamente.',
    type: CarritoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'usuarioId no es un entero mayor que cero.',
  })
  @ApiResponse({ status: 404, description: 'No existe un usuario con ese id.' })
  @Get()
  obtenerCarrito(@Param('usuarioId') usuarioId: string): CarritoResponseDto {
    return this.carritoService.obtenerCarrito(usuarioId);
  }

  @ApiOperation({
    summary: 'Agrega una variante al carrito',
    description:
      'Corresponde al boton "Agregar al carrito" de la ficha de producto. Si la variante ya ' +
      'estaba en el carrito, suma la cantidad a la linea existente. La cantidad resultante ' +
      'no puede superar el stock disponible de la variante.',
  })
  @ApiParam({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'Identificador del usuario dueno del carrito.',
    example: 1,
  })
  @ApiBody({
    description: 'Variante elegida en la ficha y cantidad que se agrega.',
    type: AgregarItemCarritoDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Variante agregada. Devuelve el carrito recalculado.',
    type: CarritoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'La cantidad no es un entero mayor que cero o supera el stock disponible.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe el usuario o no existe la variante.',
  })
  @Post('items')
  agregarItem(
    @Param('usuarioId') usuarioId: string,
    @Body() dto: AgregarItemCarritoDto,
  ): CarritoResponseDto {
    return this.carritoService.agregarItem(usuarioId, dto);
  }

  @ApiOperation({
    summary: 'Cambia la cantidad de una linea del carrito',
    description:
      'Corresponde al selector de cantidad del carrito. Reemplaza la cantidad de la linea ' +
      'indicada, por eso es PATCH y no PUT: se modifica un solo campo de la linea. La nueva ' +
      'cantidad debe ser mayor que cero y no puede superar el stock de la variante.',
  })
  @ApiParam({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'Identificador del usuario dueno del carrito.',
    example: 1,
  })
  @ApiParam({
    name: 'varianteId',
    type: Number,
    required: true,
    description:
      'Identificador de la variante que identifica la linea del carrito.',
    example: 101,
  })
  @ApiBody({
    description: 'Nueva cantidad de la linea.',
    type: ActualizarCantidadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada. Devuelve el carrito recalculado.',
    type: CarritoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'La cantidad no es un entero mayor que cero o supera el stock disponible.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe el usuario, o la variante no esta en el carrito.',
  })
  @Patch('items/:varianteId')
  actualizarCantidad(
    @Param('usuarioId') usuarioId: string,
    @Param('varianteId') varianteId: string,
    @Body() dto: ActualizarCantidadDto,
  ): CarritoResponseDto {
    return this.carritoService.actualizarCantidad(usuarioId, varianteId, dto);
  }

  @ApiOperation({
    summary: 'Elimina una linea del carrito',
    description:
      'Corresponde al boton de eliminar de cada linea del carrito. Devuelve el carrito ya ' +
      'recalculado con codigo 200, y no 204, porque la respuesta si tiene cuerpo: el ' +
      'frontend necesita el nuevo subtotal y el nuevo contador del header.',
  })
  @ApiParam({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'Identificador del usuario dueno del carrito.',
    example: 1,
  })
  @ApiParam({
    name: 'varianteId',
    type: Number,
    required: true,
    description:
      'Identificador de la variante que identifica la linea del carrito.',
    example: 101,
  })
  @ApiResponse({
    status: 200,
    description: 'Linea eliminada. Devuelve el carrito recalculado.',
    type: CarritoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'usuarioId o varianteId no son enteros validos.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe el usuario, o la variante no esta en el carrito.',
  })
  @Delete('items/:varianteId')
  eliminarItem(
    @Param('usuarioId') usuarioId: string,
    @Param('varianteId') varianteId: string,
  ): CarritoResponseDto {
    return this.carritoService.eliminarItem(usuarioId, varianteId);
  }
}

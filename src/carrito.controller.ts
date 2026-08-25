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
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { CarritoService } from './carrito.service';
import { AgregarItemCarritoDto } from './dto/agregar-item-carrito.dto';
import { ActualizarCantidadDto } from './dto/actualizar-cantidad.dto';
import { CarritoResponseDto } from './dto/carrito-response.dto';

@ApiTags('carrito')
@Controller('usuarios/:usuarioId/carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @ApiOperation({
    summary: 'Obtiene el carrito del usuario',
    description:
      'Devuelve las lineas del carrito y los totales calculados por el Backend.',
  })
  @ApiParam({
    name: 'usuarioId',
    example: 1,
    description: 'Identificador del usuario dueno del carrito',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito obtenido correctamente',
    type: CarritoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @Get()
  obtenerCarrito(@Param('usuarioId') usuarioId: string) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }

  @ApiOperation({
    summary: 'Agrega una variante al carrito',
    description:
      'La linea del carrito se identifica por variante (producto + talla + color).',
  })
  @ApiParam({ name: 'usuarioId', example: 1 })
  @ApiBody({
    description: 'Variante y cantidad a agregar',
    type: AgregarItemCarritoDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Item agregado, carrito recalculado',
    type: CarritoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'La cantidad debe ser mayor que cero',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario o variante no encontrados',
  })
  @Post('items')
  agregarItem(
    @Param('usuarioId') usuarioId: string,
    @Body() agregarItemCarritoDto: AgregarItemCarritoDto,
  ) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }

  @ApiOperation({ summary: 'Actualiza la cantidad de una linea del carrito' })
  @ApiParam({ name: 'usuarioId', example: 1 })
  @ApiParam({
    name: 'varianteId',
    example: 101,
    description: 'Identificador de la variante',
  })
  @ApiBody({ description: 'Nueva cantidad', type: ActualizarCantidadDto })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada, carrito recalculado',
    type: CarritoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'La cantidad debe ser mayor que cero',
  })
  @ApiResponse({ status: 404, description: 'Linea del carrito no encontrada' })
  @Patch('items/:varianteId')
  actualizarCantidad(
    @Param('usuarioId') usuarioId: string,
    @Param('varianteId') varianteId: string,
    @Body() actualizarCantidadDto: ActualizarCantidadDto,
  ) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }

  @ApiOperation({ summary: 'Elimina una linea del carrito' })
  @ApiParam({ name: 'usuarioId', example: 1 })
  @ApiParam({ name: 'varianteId', example: 101 })
  @ApiResponse({
    status: 200,
    description: 'Linea eliminada, carrito recalculado',
    type: CarritoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Linea del carrito no encontrada' })
  @Delete('items/:varianteId')
  eliminarItem(
    @Param('usuarioId') usuarioId: string,
    @Param('varianteId') varianteId: string,
  ) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }
}

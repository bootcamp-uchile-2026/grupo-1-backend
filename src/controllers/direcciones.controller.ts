import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ActualizarDireccionDto } from '../dto/actualizar-direccion.dto';
import { CrearDireccionDto } from '../dto/crear-direccion.dto';
import { DireccionResponseDto } from '../dto/direccion-response.dto';
import { DireccionesService } from '../services/direcciones.service';

/**
 * Recurso Direcciones.
 * Una direccion siempre pertenece a un usuario, por eso la ruta es anidada.
 */
@ApiTags('direcciones')
@ApiBadRequestResponse({
  description: 'La entrada no cumple el contrato del endpoint.',
})
@ApiParam({
  name: 'usuarioId',
  type: Number,
  description: 'Identificador del usuario dueno de las direcciones.',
  example: 1,
})
@ApiNotFoundResponse({
  description: 'No existe el usuario, o la direccion no existe o no es suya.',
})
@Controller('usuarios/:usuarioId/direcciones')
export class DireccionesController {
  constructor(private readonly direccionesService: DireccionesService) {}

  @ApiOperation({ summary: 'Lista las direcciones del usuario' })
  @ApiOkResponse({
    description: 'Direcciones obtenidas correctamente.',
    type: [DireccionResponseDto],
  })
  @Get()
  async obtenerDirecciones(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<DireccionResponseDto[]> {
    return this.direccionesService.obtenerDirecciones(usuarioId);
  }

  @ApiOperation({ summary: 'Agrega una direccion al usuario' })
  @ApiCreatedResponse({
    description: 'Direccion creada.',
    type: DireccionResponseDto,
  })
  @Post()
  async crearDireccion(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: CrearDireccionDto,
  ): Promise<DireccionResponseDto> {
    return this.direccionesService.crearDireccion(usuarioId, datos);
  }

  @ApiOperation({
    summary: 'Actualiza una direccion',
    description: 'Modifica solo los campos enviados.',
  })
  @ApiParam({
    name: 'direccionId',
    type: Number,
    description: 'Identificador de la direccion.',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Direccion actualizada. Devuelve la direccion completa.',
    type: DireccionResponseDto,
  })
  @Patch(':direccionId')
  async actualizarDireccion(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('direccionId', ParseIntPipe) direccionId: number,
    @Body() datos: ActualizarDireccionDto,
  ): Promise<DireccionResponseDto> {
    return this.direccionesService.actualizarDireccion(
      usuarioId,
      direccionId,
      datos,
    );
  }

  @ApiOperation({ summary: 'Elimina una direccion' })
  @ApiParam({
    name: 'direccionId',
    type: Number,
    description: 'Identificador de la direccion.',
    example: 1,
  })
  @ApiNoContentResponse({ description: 'Direccion eliminada.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':direccionId')
  async eliminarDireccion(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('direccionId', ParseIntPipe) direccionId: number,
  ): Promise<void> {
    await this.direccionesService.eliminarDireccion(usuarioId, direccionId);
  }
}

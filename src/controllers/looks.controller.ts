import { IdPositivoPipe } from '../common/id-positivo.pipe';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ErrorResponseDto } from '../dto/error-response.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CrearLookDto } from '../dto/crear-look.dto';
import { GuardarLookDto } from '../dto/guardar-look.dto';
import { LookResponseDto } from '../dto/look-response.dto';
import { PaginacionQueryDto } from '../dto/paginacion-query.dto';
import { LooksPaginadosResponseDto } from '../dto/looks-paginados-response.dto';
import { LooksService } from '../services/looks.service';

/**
 * Recurso Looks.
 * /looks es el recurso publico: explorar, ver y componer looks.
 * /usuarios/{usuarioId}/looks es la coleccion de looks guardados por un
 * usuario: guardar no crea un look, asocia uno existente a la cuenta.
 */
@ApiTags('looks')
@ApiBadRequestResponse({
  type: ErrorResponseDto,
  description: 'La entrada no cumple el contrato del endpoint.',
})
@Controller()
export class LooksController {
  constructor(private readonly looksService: LooksService) {}

  @ApiOperation({ summary: 'Lista los looks publicados' })
  @ApiOkResponse({
    description: 'Looks obtenidos correctamente.',
    type: LooksPaginadosResponseDto,
  })
  @Get('looks')
  async obtenerLooks(
    @Query() paginacion: PaginacionQueryDto,
  ): Promise<LooksPaginadosResponseDto> {
    return this.looksService.obtenerLooks(paginacion.pagina, paginacion.limite);
  }

  @ApiOperation({ summary: 'Obtiene el detalle de un look' })
  @ApiParam({
    name: 'lookId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
    description: 'Identificador del look.',
    example: 1,
  })
  @ApiOkResponse({ description: 'Look encontrado.', type: LookResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'No existe un look con ese id.',
  })
  @Get('looks/:lookId')
  async obtenerLook(
    @Param('lookId', IdPositivoPipe) lookId: number,
  ): Promise<LookResponseDto> {
    return this.looksService.obtenerLook(lookId);
  }

  @ApiOperation({
    summary: 'Compone un look nuevo',
    description:
      'Crea un look a partir de productos y variantes del catalogo. El precio total ' +
      'lo calcula el backend.',
  })
  @ApiCreatedResponse({ description: 'Look creado.', type: LookResponseDto })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description:
      'Algun producto no existe o la variante no pertenece a ese producto.',
  })
  @Post('looks')
  async crearLook(@Body() datos: CrearLookDto): Promise<LookResponseDto> {
    return this.looksService.crearLook(datos);
  }

  @ApiOperation({
    summary: 'Guarda un look en la cuenta del usuario',
    description:
      'Asocia un look existente a la cuenta del usuario. No crea un look nuevo: ' +
      'para eso existe POST /looks.',
  })
  @ApiParam({
    name: 'usuarioId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
    description: 'Identificador del usuario que guarda el look.',
    example: 1,
  })
  @ApiCreatedResponse({
    description: 'Look guardado. Devuelve el look guardado.',
    type: LookResponseDto,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'No existe el usuario o no existe el look.',
  })
  @Post('usuarios/:usuarioId/looks')
  async guardarLook(
    @Param('usuarioId', IdPositivoPipe) usuarioId: number,
    @Body() datos: GuardarLookDto,
  ): Promise<LookResponseDto> {
    return this.looksService.guardarLook(usuarioId, datos);
  }
}

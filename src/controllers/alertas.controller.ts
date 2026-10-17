import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { AlertaResponseDto } from '../dto/alerta-response.dto';
import { CrearAlertaPrecioDto } from '../dto/crear-alerta-precio.dto';
import { CrearAvisoReposicionDto } from '../dto/crear-aviso-reposicion.dto';
import { AlertasService } from '../services/alertas.service';

/**
 * Recurso Alertas.
 * Alertas de precio y avisos de reposicion que el usuario registra desde la
 * ficha de producto. Ambos tipos comparten listado, borrado y DTO de salida.
 */
@ApiTags('alertas')
@ApiBadRequestResponse({
  description: 'La entrada no cumple el contrato del endpoint.',
})
@ApiParam({
  name: 'usuarioId',
  type: Number,
  description: 'Identificador del usuario dueno de las alertas.',
  example: 1,
})
@ApiNotFoundResponse({
  description:
    'No existe el usuario, la alerta no existe o no es suya, o el producto o la ' +
    'variante indicados no existen en el catalogo.',
})
@Controller('usuarios/:usuarioId/alertas')
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @ApiOperation({ summary: 'Lista las alertas del usuario' })
  @ApiOkResponse({
    description: 'Alertas obtenidas correctamente.',
    type: [AlertaResponseDto],
  })
  @Get()
  async obtenerAlertas(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<AlertaResponseDto[]> {
    return this.alertasService.obtenerAlertas(usuarioId);
  }

  @ApiOperation({
    summary: 'Crea una alerta de baja de precio',
    description:
      'Registra el interes del usuario en saber cuando un producto baja de precio. ' +
      'No envia ninguna notificacion.',
  })
  @ApiCreatedResponse({
    description: 'Alerta de precio creada.',
    type: AlertaResponseDto,
  })
  @Post('precio')
  async crearAlertaPrecio(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: CrearAlertaPrecioDto,
  ): Promise<AlertaResponseDto> {
    return this.alertasService.crearAlertaPrecio(usuarioId, datos);
  }

  @ApiOperation({
    summary: 'Crea un aviso de reposicion de stock',
    description:
      'Registra el interes del usuario en saber cuando un producto o una variante ' +
      'vuelve a tener stock. Si se indica varianteId, debe pertenecer al producto. ' +
      'No envia ninguna notificacion.',
  })
  @ApiCreatedResponse({
    description: 'Aviso de reposicion creado.',
    type: AlertaResponseDto,
  })
  @Post('reposicion')
  async crearAvisoReposicion(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() datos: CrearAvisoReposicionDto,
  ): Promise<AlertaResponseDto> {
    return this.alertasService.crearAvisoReposicion(usuarioId, datos);
  }

  @ApiOperation({ summary: 'Elimina una alerta' })
  @ApiParam({
    name: 'alertaId',
    type: Number,
    description: 'Identificador de la alerta.',
    example: 1,
  })
  @ApiNoContentResponse({ description: 'Alerta eliminada.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':alertaId')
  async eliminarAlerta(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('alertaId', ParseIntPipe) alertaId: number,
  ): Promise<void> {
    await this.alertasService.eliminarAlerta(usuarioId, alertaId);
  }
}

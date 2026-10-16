import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CambioDevolucionResponseDto } from '../dto/cambio-devolucion-response.dto';
import { CrearCambioDevolucionDto } from '../dto/crear-cambio-devolucion.dto';
import { CambiosDevolucionesService } from '../services/cambios-devoluciones.service';

/**
 * Recurso Cambios y devoluciones.
 * Una solicitud se crea y se lista dentro de un pedido del usuario, y se
 * consulta por su propio id una vez creada.
 */
@ApiTags('cambios-devoluciones')
@ApiParam({
  name: 'usuarioId',
  type: Number,
  description: 'Identificador del usuario dueno del pedido.',
  example: 1,
})
@Controller('usuarios/:usuarioId')
export class CambiosDevolucionesController {
  constructor(
    private readonly cambiosDevolucionesService: CambiosDevolucionesService,
  ) {}

  @ApiOperation({
    summary: 'Solicita un cambio o una devolucion',
    description:
      'Registra la solicitud sobre un item del pedido (items[].id del detalle del ' +
      'pedido). Un cambio exige nuevaVarianteId del mismo producto; una devolucion ' +
      'no lo admite. Nace en estado solicitada. ' +
      'No genera reembolsos ni movimientos de stock.',
  })
  @ApiParam({
    name: 'pedidoId',
    type: Number,
    description: 'Identificador del pedido.',
    example: 1001,
  })
  @ApiCreatedResponse({
    description: 'Solicitud creada.',
    type: CambioDevolucionResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Body invalido, cambio sin nuevaVarianteId, cambio por la misma variante o ' +
      'devolucion con nuevaVarianteId.',
  })
  @ApiNotFoundResponse({
    description:
      'No existe el usuario, el pedido no existe o no es suyo, el item no es de ' +
      'ese pedido, o la nueva variante no es del producto comprado.',
  })
  @Post('pedidos/:pedidoId/cambios-devoluciones')
  async crearSolicitud(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
    @Body() datos: CrearCambioDevolucionDto,
  ): Promise<CambioDevolucionResponseDto> {
    return this.cambiosDevolucionesService.crearSolicitud(
      usuarioId,
      pedidoId,
      datos,
    );
  }

  @ApiOperation({ summary: 'Lista las solicitudes de un pedido' })
  @ApiParam({
    name: 'pedidoId',
    type: Number,
    description: 'Identificador del pedido.',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'Solicitudes obtenidas. Puede venir vacio.',
    type: [CambioDevolucionResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'No existe el usuario, o el pedido no existe o no es suyo.',
  })
  @Get('pedidos/:pedidoId/cambios-devoluciones')
  async obtenerSolicitudesDePedido(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
  ): Promise<CambioDevolucionResponseDto[]> {
    return this.cambiosDevolucionesService.obtenerSolicitudesDePedido(
      usuarioId,
      pedidoId,
    );
  }

  @ApiOperation({ summary: 'Obtiene el detalle de una solicitud' })
  @ApiParam({
    name: 'solicitudId',
    type: Number,
    description: 'Identificador de la solicitud.',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Solicitud encontrada.',
    type: CambioDevolucionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe el usuario, o la solicitud no existe o no es suya.',
  })
  @Get('cambios-devoluciones/:solicitudId')
  async obtenerSolicitud(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('solicitudId', ParseIntPipe) solicitudId: number,
  ): Promise<CambioDevolucionResponseDto> {
    return this.cambiosDevolucionesService.obtenerSolicitud(
      usuarioId,
      solicitudId,
    );
  }
}

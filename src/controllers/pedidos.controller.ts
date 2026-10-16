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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CrearPedidoDto } from '../dto/crear-pedido.dto';
import { PedidoDetalleResponseDto } from '../dto/pedido-detalle-response.dto';
import { PedidoResponseDto } from '../dto/pedido-response.dto';
import { PedidosService } from '../services/pedidos.service';

/**
 * Recurso Pedidos.
 * POST /pedidos crea el pedido desde el checkout. La consulta cuelga del
 * usuario dueno: el detalle expone los items con su id propio, que es el
 * pedidoItemId que se envia al solicitar un cambio o una devolucion.
 */
@ApiTags('pedidos')
@Controller()
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @ApiOperation({
    summary: 'Crea un pedido',
    description:
      'Convierte el carrito indicado por carritoId en un pedido del dueno del carrito. ' +
      'Revalida stock, copia nombre y precio vigentes de cada producto en sus items, ' +
      'guarda contacto y direccion como foto del checkout y vacia el carrito. El ' +
      'envio no se cobra (costoEnvio 0) porque el checkout no indica modalidad de ' +
      'despacho, y el stock del catalogo no se descuenta. Devuelve el detalle ' +
      'completo, con items, para que el frontend no necesite una segunda consulta.',
  })
  @ApiCreatedResponse({
    description:
      'Pedido creado. Aparece desde ya en los pedidos del usuario y el carrito queda vacio.',
    type: PedidoDetalleResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El body no cumple el contrato, el carrito no tiene items o alguna linea supera ' +
      'el stock disponible. En estos casos no se crea el pedido y el carrito no cambia.',
  })
  @ApiNotFoundResponse({ description: 'No existe el carrito indicado.' })
  @ApiConflictResponse({
    description: 'Ya hay un checkout en curso para el mismo carrito.',
  })
  @Post('pedidos')
  async crearPedido(
    @Body() datos: CrearPedidoDto,
  ): Promise<PedidoDetalleResponseDto> {
    return this.pedidosService.crearPedido(datos);
  }

  @ApiOperation({ summary: 'Lista los pedidos del usuario' })
  @ApiParam({
    name: 'usuarioId',
    type: Number,
    description: 'Identificador del usuario dueno de los pedidos.',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Pedidos obtenidos. Puede venir vacio.',
    type: [PedidoResponseDto],
  })
  @ApiNotFoundResponse({ description: 'No existe el usuario.' })
  @Get('usuarios/:usuarioId/pedidos')
  async obtenerPedidos(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
  ): Promise<PedidoResponseDto[]> {
    return this.pedidosService.obtenerPedidos(usuarioId);
  }

  @ApiOperation({
    summary: 'Obtiene el detalle de un pedido',
    description:
      'Devuelve el pedido con sus items. El id de cada item es el pedidoItemId ' +
      'que se envia en POST /usuarios/{usuarioId}/pedidos/{pedidoId}/cambios-devoluciones.',
  })
  @ApiParam({
    name: 'usuarioId',
    type: Number,
    description: 'Identificador del usuario dueno del pedido.',
    example: 1,
  })
  @ApiParam({
    name: 'pedidoId',
    type: Number,
    description: 'Identificador del pedido.',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'Pedido encontrado.',
    type: PedidoDetalleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe el usuario, o el pedido no existe o no es suyo.',
  })
  @Get('usuarios/:usuarioId/pedidos/:pedidoId')
  async obtenerPedido(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
  ): Promise<PedidoDetalleResponseDto> {
    return this.pedidosService.obtenerPedido(usuarioId, pedidoId);
  }
}

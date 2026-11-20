import type { SchemaObject } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiServiceUnavailableResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { IdPositivoPipe } from '../common/id-positivo.pipe';
import { UsuarioAutenticado } from '../seguridad/usuario-autenticado.decorator';
import { LogisticaService, ESTADOS_ENVIO } from '../services/logistica.service';
import type { EstadoEnvio } from '../services/logistica.service';

const ESQUEMA_ENVIO: SchemaObject = {
  type: 'object',
  required: ['id', 'pedido_id', 'estado', 'despachado_en'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    pedido_id: { type: 'integer', minimum: 1 },
    estado: { type: 'string', enum: [...ESTADOS_ENVIO] },
    despachado_en: { type: 'string', format: 'date-time', nullable: true },
  },
};
const ESQUEMA_SEGUIMIENTO: SchemaObject = {
  type: 'object',
  required: ['pedidoId', 'estado', 'despachadoEn', 'eventos'],
  properties: {
    pedidoId: { type: 'integer', minimum: 1 },
    estado: { type: 'string', enum: [...ESTADOS_ENVIO] },
    despachadoEn: { type: 'string', format: 'date-time', nullable: true },
    eventos: {
      type: 'array',
      items: {
        type: 'object',
        required: ['anterior', 'nuevo', 'fecha'],
        properties: {
          anterior: {
            type: 'string',
            enum: [...ESTADOS_ENVIO, null],
            nullable: true,
          },
          nuevo: { type: 'string', enum: [...ESTADOS_ENVIO] },
          fecha: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
const ESQUEMA_CANCELACION: SchemaObject = {
  type: 'object',
  required: ['pedidoId', 'estado', 'stockRestituido', 'fecha'],
  properties: {
    pedidoId: { type: 'integer', minimum: 1 },
    estado: { type: 'string', enum: ['cancelado'] },
    stockRestituido: { type: 'boolean' },
    fecha: { type: 'string', format: 'date-time' },
  },
};

export class TransicionEnvioDto {
  @ApiProperty({ enum: ESTADOS_ENVIO })
  @IsIn(ESTADOS_ENVIO)
  estado!: EstadoEnvio;
}
export class CancelarPedidoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() motivo?: string;
}
@ApiTags('logistica')
@ApiBearerAuth()
@ApiBadRequestResponse({
  type: ErrorResponseDto,
  description: 'Entrada invalida.',
})
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'JWT ausente, invalido o expirado.',
})
@ApiNotFoundResponse({
  type: ErrorResponseDto,
  description: 'Recurso inexistente o ajeno.',
})
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: 'Conflicto de estado o persistencia.',
})
@ApiServiceUnavailableResponse({
  type: ErrorResponseDto,
  description: 'La operacion requiere MySQL.',
})
@ApiInternalServerErrorResponse({
  type: ErrorResponseDto,
  description: 'Error interno sin detalles sensibles.',
})
@Controller()
export class LogisticaController {
  constructor(private readonly service: LogisticaService) {}
  @ApiOperation({ summary: 'Crea envio pendiente (solo operador autorizado)' })
  @ApiParam({
    name: 'pedidoId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Sin permiso operativo.',
  })
  @ApiCreatedResponse({ schema: ESQUEMA_ENVIO })
  @Post('operaciones/pedidos/:pedidoId/envio')
  crear(
    @Param('pedidoId', IdPositivoPipe) id: number,
    @UsuarioAutenticado() actor: number,
  ) {
    return this.service.crearEnvio(id, actor);
  }
  @ApiOperation({ summary: 'Transicion logistica (solo operador autorizado)' })
  @ApiParam({
    name: 'pedidoId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Sin permiso operativo.',
  })
  @ApiOkResponse({ schema: ESQUEMA_ENVIO })
  @Patch('operaciones/pedidos/:pedidoId/envio')
  cambiar(
    @Param('pedidoId', IdPositivoPipe) id: number,
    @UsuarioAutenticado() actor: number,
    @Body() d: TransicionEnvioDto,
  ) {
    return this.service.transicionar(id, d.estado, actor);
  }
  @ApiParam({
    name: 'pedidoId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiParam({
    name: 'usuarioId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiOkResponse({ schema: ESQUEMA_SEGUIMIENTO })
  @Get('usuarios/:usuarioId/pedidos/:pedidoId/seguimiento')
  seguir(
    @Param('pedidoId', IdPositivoPipe) id: number,
    @Param('usuarioId', IdPositivoPipe) _usuario: number,
    @UsuarioAutenticado() actor: number,
  ) {
    void _usuario;
    return this.service.seguimiento(id, actor);
  }
  @ApiParam({
    name: 'pedidoId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiParam({
    name: 'usuarioId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiCreatedResponse({ schema: ESQUEMA_CANCELACION })
  @Post('usuarios/:usuarioId/pedidos/:pedidoId/cancelacion')
  cancelar(
    @Param('pedidoId', IdPositivoPipe) id: number,
    @Param('usuarioId', IdPositivoPipe) _usuario: number,
    @UsuarioAutenticado() actor: number,
    @Body() d: CancelarPedidoDto,
  ) {
    void _usuario;
    return this.service.cancelar(id, actor, d.motivo);
  }
}

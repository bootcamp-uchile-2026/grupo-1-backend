import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { IdPositivoPipe } from '../common/id-positivo.pipe';
import { UsuarioAutenticado } from '../seguridad/usuario-autenticado.decorator';
import { LogisticaService, ESTADOS_ENVIO } from '../services/logistica.service';
import type { EstadoEnvio } from '../services/logistica.service';
export class TransicionEnvioDto {
  @ApiProperty({ enum: ESTADOS_ENVIO })
  @IsIn(ESTADOS_ENVIO)
  estado!: EstadoEnvio;
}
export class CancelarPedidoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() motivo?: string;
}
@ApiTags('logistica')
@Controller()
export class LogisticaController {
  constructor(private readonly service: LogisticaService) {}
  @ApiOperation({ summary: 'Crea envio pendiente (solo operador autorizado)' })
  @ApiParam({
    name: 'pedidoId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
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

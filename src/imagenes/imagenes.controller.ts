import { ErrorResponseDto } from '../dto/error-response.dto';
import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Publico } from '../seguridad/publico.decorator';
import { UsuarioAutenticado } from '../seguridad/usuario-autenticado.decorator';
import { IdPositivoPipe } from '../common/id-positivo.pipe';
import { AdministrarImagenesGuard } from './imagenes.guard';
import { ImagenesService } from './imagenes.service';
import { ARCHIVO_IMAGEN, MAX_IMAGEN_BYTES } from './validar-imagen';

interface ArchivoSubido {
  buffer: Buffer;
}
@ApiTags('imagenes')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  type: ErrorResponseDto,
  description: 'JWT requerido',
})
@ApiResponse({
  status: 403,
  type: ErrorResponseDto,
  description: 'Sin permiso administrativo',
})
@ApiResponse({
  status: 503,
  type: ErrorResponseDto,
  description: 'La operacion requiere MySQL',
})
@UseGuards(AdministrarImagenesGuard)
@Controller('administracion')
export class AdministrarImagenesController {
  constructor(private readonly service: ImagenesService) {}
  @ApiOperation({
    summary: 'Agrega una imagen a la galeria del producto',
    description:
      'Requiere JWT y permiso productos.imagenes.gestionar. JPEG, PNG o WebP estatico; 5 MiB, 16 millones de pixeles. Recodifica contenido real, ignora nombre/MIME del cliente. La portada existente no cambia.',
  })
  @ApiParam({
    name: 'productoId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagen'],
      additionalProperties: false,
      properties: { imagen: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({
    schema: {
      type: 'object',
      properties: {
        productoId: { type: 'integer' },
        posicion: { type: 'integer' },
        url: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Contenido invalido, animado o archivo ausente',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'JWT requerido',
  })
  @ApiResponse({
    status: 403,
    type: ErrorResponseDto,
    description: 'Sin permiso administrativo',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Producto inexistente',
  })
  @ApiResponse({
    status: 413,
    type: ErrorResponseDto,
    description: 'Imagen mayor a 5 MiB',
  })
  @ApiResponse({
    status: 503,
    type: ErrorResponseDto,
    description: 'Procesador de imagenes ocupado',
  })
  @Post('productos/:productoId/imagenes')
  @UseInterceptors(
    FileInterceptor('imagen', {
      limits: { fileSize: MAX_IMAGEN_BYTES, files: 1, fields: 0, parts: 2 },
    }),
  )
  cargar(
    @Param('productoId', IdPositivoPipe) id: number,
    @UsuarioAutenticado() actor: number,
    @UploadedFile() file?: ArchivoSubido,
  ) {
    return this.service.cargar(id, actor, file?.buffer);
  }
  @ApiOperation({
    summary: 'Reconciliar cargas fallidas o pendientes de mas de 15 minutos',
    description:
      'Solo permiso administrativo. Procesa hasta 100 registros. Nunca borra archivos publicados ni barre directorios; archivos alterados/parciales requieren revision.',
  })
  @Post('imagenes/reconciliacion')
  reconciliar() {
    return this.service.reconciliar();
  }
}
@ApiTags('imagenes')
@Publico()
@Controller('imagenes/productos')
export class ImagenesPublicasController {
  constructor(private readonly service: ImagenesService) {}
  @ApiOperation({
    summary: 'Lee una imagen publicada; no requiere autenticacion',
  })
  @ApiParam({
    name: 'archivo',
    schema: { type: 'string', pattern: ARCHIVO_IMAGEN.source },
  })
  @ApiResponse({
    status: 200,
    description: 'Bytes JPEG, PNG o WebP',
    content: {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'image/webp': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Imagen no publicada o inexistente',
  })
  @Get(':archivo')
  async abrir(
    @Param('archivo') archivo: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const image = await this.service.abrir(archivo);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return image;
  }
}

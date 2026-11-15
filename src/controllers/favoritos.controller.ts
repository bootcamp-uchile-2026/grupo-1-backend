import { IdPositivoPipe } from '../common/id-positivo.pipe';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ErrorResponseDto } from '../dto/error-response.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductoDetalleResponseDto } from '../dto/producto-detalle-response.dto';
import { AgregarFavoritoDto } from '../dto/agregar-favorito.dto';
import { FavoritoResponseDto } from '../dto/favorito-response.dto';
import { FavoritosService } from '../services/favoritos.service';

@ApiTags('favoritos')
@Controller('usuarios/:usuarioId/favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los productos favoritos del usuario' })
  @ApiParam({
    name: 'usuarioId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
  })
  @ApiResponse({ status: 200, type: [ProductoDetalleResponseDto] })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 400,
    description: 'El identificador debe ser un entero positivo seguro.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 404,
    description: 'El usuario no existe.',
  })
  listar(
    @Param('usuarioId', IdPositivoPipe) usuarioId: number,
  ): Promise<ProductoDetalleResponseDto[]> {
    return this.favoritosService.listar(usuarioId);
  }

  @ApiOperation({
    summary: 'Agrega un producto a favoritos',
    description:
      'Corresponde al boton "Agregar a favoritos" de la ficha de producto. Se envia el ' +
      'producto y no la variante porque el wireframe marca el producto completo, sin exigir ' +
      'color ni talla. Un mismo producto no se puede guardar dos veces para el mismo usuario.',
  })
  @ApiParam({
    name: 'usuarioId',
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
    required: true,
    description: 'Identificador del usuario dueno de la lista de favoritos.',
    example: 1,
  })
  @ApiBody({
    description: 'Producto que se marca como favorito.',
    type: AgregarFavoritoDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Producto agregado a favoritos.',
    type: FavoritoResponseDto,
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 400,
    description: 'usuarioId o productoId no son enteros validos.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 404,
    description: 'No existe el usuario o no existe el producto.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 409,
    description: 'El producto ya esta en la lista de favoritos.',
  })
  @Post()
  async agregarFavorito(
    @Param('usuarioId', IdPositivoPipe) usuarioId: number,
    @Body() dto: AgregarFavoritoDto,
  ): Promise<FavoritoResponseDto> {
    return this.favoritosService.agregarFavorito(usuarioId, dto);
  }
}

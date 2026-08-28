import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgregarFavoritoDto } from '../dto/agregar-favorito.dto';
import { FavoritoResponseDto } from '../dto/favorito-response.dto';
import { FavoritosService } from '../services/favoritos.service';

/**
 * Recurso Favoritos.
 * Hito 1 implementa unicamente el boton "Agregar a favoritos" de la ficha de
 * producto, que es la unica accion que el wireframe demuestra. La lectura y
 * el borrado de favoritos se definiran cuando se analice formalmente la
 * vista Favoritos de Mi Cuenta.
 */
@ApiTags('favoritos')
@Controller('usuarios/:usuarioId/favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @ApiOperation({
    summary: 'Agrega un producto a favoritos',
    description:
      'Corresponde al boton "Agregar a favoritos" de la ficha de producto. Se envia el ' +
      'producto y no la variante porque el wireframe marca el producto completo, sin exigir ' +
      'color ni talla. Un mismo producto no se puede guardar dos veces para el mismo usuario.',
  })
  @ApiParam({
    name: 'usuarioId',
    type: Number,
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
    status: 400,
    description: 'usuarioId o productoId no son enteros validos.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe el usuario o no existe el producto.',
  })
  @ApiResponse({
    status: 409,
    description: 'El producto ya esta en la lista de favoritos.',
  })
  @Post()
  agregarFavorito(
    @Param('usuarioId') usuarioId: string,
    @Body() dto: AgregarFavoritoDto,
  ): FavoritoResponseDto {
    return this.favoritosService.agregarFavorito(usuarioId, dto);
  }
}

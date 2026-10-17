import { Injectable } from '@nestjs/common';
import { ConflictoDominioError } from '../dominio/errores-dominio';
import { AgregarFavoritoDto } from '../dto/agregar-favorito.dto';
import { FavoritoResponseDto } from '../dto/favorito-response.dto';
import { FavoritosRepository } from '../repositorios/favoritos.repository';
import { ProductosService } from './productos.service';
import { UsuariosService } from './usuarios.service';

/**
 * Favoritos de StyleNow: el boton "Agregar a favoritos" de la ficha.
 * Se guarda el producto completo, sin variante, y una sola vez por usuario.
 */
@Injectable()
export class FavoritosService {
  constructor(
    private readonly favoritos: FavoritosRepository,
    private readonly usuariosService: UsuariosService,
    private readonly productosService: ProductosService,
  ) {}

  /** Guarda un producto en la lista de favoritos del usuario. */
  async agregarFavorito(
    usuarioId: number,
    datos: AgregarFavoritoDto,
  ): Promise<FavoritoResponseDto> {
    await this.usuariosService.obtenerUsuario(usuarioId);
    const producto = await this.productosService.obtenerProductoPorId(
      datos.productoId,
    );
    const agregado = await this.favoritos.agregar(usuarioId, producto.id);
    if (!agregado) {
      throw new ConflictoDominioError(
        'El producto ya esta en la lista de favoritos',
      );
    }
    return {
      usuarioId,
      productoId: producto.id,
      mensaje: 'Producto agregado a favoritos',
    };
  }
}

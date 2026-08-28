import { ConflictException, Injectable } from '@nestjs/common';
import { AgregarFavoritoDto } from '../dto/agregar-favorito.dto';
import { FavoritoResponseDto } from '../dto/favorito-response.dto';
import { AuthService } from './auth.service';
import { ProductosService } from './productos.service';

/**
 * Favoritos de StyleNow.
 * En Hito 1 solo se implementa el boton "Agregar a favoritos" de la ficha,
 * que es lo unico que el wireframe demuestra. La vista de Favoritos de
 * Mi Cuenta se analizara mas adelante.
 */
@Injectable()
export class FavoritosService {
  private readonly favoritosPorUsuario = new Map<number, number[]>();

  constructor(
    private readonly productosService: ProductosService,
    private readonly authService: AuthService,
  ) {}

  /** Guarda un producto en la lista de favoritos del usuario. */
  agregarFavorito(
    usuarioId: string,
    dto: AgregarFavoritoDto,
  ): FavoritoResponseDto {
    const id = this.authService.obtenerUsuarioPorId(usuarioId).id;
    const producto = this.productosService.obtenerProductoPorId(
      dto?.productoId,
    );
    const favoritos = this.favoritosPorUsuario.get(id) ?? [];

    if (favoritos.includes(producto.id)) {
      throw new ConflictException(
        'El producto ya esta en la lista de favoritos',
      );
    }

    favoritos.push(producto.id);
    this.favoritosPorUsuario.set(id, favoritos);

    return {
      usuarioId: id,
      productoId: producto.id,
      mensaje: 'Producto agregado a favoritos',
    };
  }
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Confirmacion de que un producto quedo guardado en favoritos.
 */
export class FavoritoResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador de usuario',
    description: 'Usuario dueno de la lista de favoritos.',
    example: 1,
    required: true,
  })
  usuarioId: number;

  @ApiProperty({
    type: Number,
    title: 'Identificador de producto',
    description: 'Producto que quedo guardado en favoritos.',
    example: 1,
    required: true,
  })
  productoId: number;

  @ApiProperty({
    type: String,
    title: 'Mensaje',
    description:
      'Texto de confirmacion que el frontend puede mostrar en la ficha.',
    example: 'Producto agregado a favoritos',
    required: true,
  })
  mensaje: string;
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Publicacion de la seccion Comunidad. El wireframe solo muestra tarjetas
 * de lectura, por eso el contrato es de solo lectura.
 */
export class PostResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador',
    description: 'Identificador de la publicacion.',
    example: 1,
    required: true,
  })
  id: number;

  @ApiProperty({
    type: String,
    title: 'Titulo',
    description: 'Titulo de la publicacion.',
    example: 'Como combinar tus basicos de temporada',
    required: true,
  })
  titulo: string;

  @ApiProperty({
    type: String,
    title: 'Contenido',
    description: 'Texto de la publicacion mostrado en la tarjeta.',
    example:
      'Tres combinaciones simples para renovar tu closet sin comprar de mas.',
    required: true,
  })
  contenido: string;

  @ApiProperty({
    type: String,
    title: 'Imagen',
    description: 'Imagen de la tarjeta de comunidad.',
    example: 'https://cdn.stylenow.cl/comunidad/basicos-temporada.jpg',
    required: true,
  })
  imagenUrl: string;
}

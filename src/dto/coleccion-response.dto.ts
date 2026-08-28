import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Look editorial usado en "Inspiracion para ti" y en la navegacion de Looks.
 */
export class ColeccionResponseDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador',
    description: 'Identificador de la coleccion.',
    example: 1,
    required: true,
  })
  id: number;

  @ApiProperty({
    type: String,
    title: 'Nombre',
    description: 'Nombre del look o coleccion.',
    example: 'Look urbano',
    required: true,
  })
  nombre: string;

  @ApiProperty({
    type: String,
    title: 'Descripcion',
    description: 'Texto editorial corto que acompana la imagen del look.',
    example: 'Prendas comodas en tonos neutros para el dia a dia.',
    required: true,
  })
  descripcion: string;

  @ApiProperty({
    type: String,
    title: 'Imagen',
    description: 'Imagen principal del look.',
    example: 'https://cdn.stylenow.cl/colecciones/look-urbano.jpg',
    required: true,
  })
  imagenUrl: string;
}

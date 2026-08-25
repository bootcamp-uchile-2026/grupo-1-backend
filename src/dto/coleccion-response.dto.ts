import { ApiProperty } from '@nestjs/swagger';

export class ColeccionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Look urbano de invierno' })
  titulo: string;

  @ApiProperty({ example: 'look-urbano-invierno' })
  slug: string;

  @ApiProperty({ example: 'https://cdn.stylenow.cl/col/1.jpg' })
  imagenUrl: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class PostResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Como combinar una chaqueta oversize' })
  titulo: string;

  @ApiProperty({
    example: 'Tres formas de llevar la chaqueta de denim esta temporada.',
  })
  extracto: string;

  @ApiProperty({ example: 'https://cdn.stylenow.cl/posts/1.jpg' })
  imagenUrl: string;

  @ApiProperty({ example: 'Equipo StyleNow' })
  autor: string;

  @ApiProperty({ example: '2026-08-20' })
  fecha: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class ProductoResponseDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Chaqueta Oversize' })
  nombre: string;

  @ApiProperty({ example: 49990 })
  precio: number;

  @ApiProperty({ example: 'https://cdn.stylenow.cl/p/12.jpg' })
  imagenUrl: string;

  @ApiProperty({ example: 'mujer' })
  genero: string;

  @ApiProperty({ example: 'chaquetas' })
  categoria: string;

  @ApiProperty({ example: true })
  novedad: boolean;

  @ApiProperty({ example: false })
  oferta: boolean;
}

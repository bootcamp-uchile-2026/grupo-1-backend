import { ApiProperty } from '@nestjs/swagger';

export class CategoriaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Mujer' })
  nombre: string;

  @ApiProperty({ example: 'mujer' })
  slug: string;

  @ApiProperty({ example: 'https://cdn.stylenow.cl/cat/mujer.jpg' })
  imagenUrl: string;

  @ApiProperty({ example: true })
  destacada: boolean;
}

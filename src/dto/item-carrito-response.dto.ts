import { ApiProperty } from '@nestjs/swagger';

export class ItemCarritoResponseDto {
  @ApiProperty({ example: 101 })
  varianteId: number;

  @ApiProperty({ example: 12 })
  productoId: number;

  @ApiProperty({ example: 'Chaqueta Oversize' })
  nombre: string;

  @ApiProperty({ example: 'M' })
  talla: string;

  @ApiProperty({ example: 'negro' })
  color: string;

  @ApiProperty({ example: 'https://cdn.stylenow.cl/p/12.jpg' })
  imagenUrl: string;

  @ApiProperty({ example: 49990 })
  precioUnitario: number;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ example: 99980 })
  subtotal: number;
}

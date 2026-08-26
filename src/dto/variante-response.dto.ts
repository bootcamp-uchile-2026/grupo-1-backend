import { ApiProperty } from '@nestjs/swagger';

export class VarianteResponseDto {
  @ApiProperty({ example: 101 })
  id: number;

  @ApiProperty({ example: 'M' })
  talla: string;

  @ApiProperty({ example: 'negro' })
  color: string;

  @ApiProperty({ example: 8 })
  stock: number;
}

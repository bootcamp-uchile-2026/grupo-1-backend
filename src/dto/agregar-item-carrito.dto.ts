import { ApiProperty } from '@nestjs/swagger';

export class AgregarItemCarritoDto {
  @ApiProperty({
    example: 101,
    description: 'Identificador de la variante (producto + talla + color)',
  })
  varianteId: number;

  @ApiProperty({ example: 2 })
  cantidad: number;
}

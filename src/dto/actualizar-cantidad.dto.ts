import { ApiProperty } from '@nestjs/swagger';

export class ActualizarCantidadDto {
  @ApiProperty({ example: 3 })
  cantidad: number;
}

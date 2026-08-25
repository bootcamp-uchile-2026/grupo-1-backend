import { ApiProperty } from '@nestjs/swagger';
import { ItemCarritoResponseDto } from './item-carrito-response.dto';

export class CarritoResponseDto {
  @ApiProperty({ example: 1 })
  usuarioId: number;

  @ApiProperty({ type: [ItemCarritoResponseDto] })
  items: ItemCarritoResponseDto[];

  @ApiProperty({ example: 3 })
  totalItems: number;

  @ApiProperty({ example: 149970 })
  total: number;
}

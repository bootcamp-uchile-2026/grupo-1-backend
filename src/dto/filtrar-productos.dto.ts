import { ApiProperty } from '@nestjs/swagger';

export class FiltrarProductosDto {
  @ApiProperty({ required: false, example: 'mujer' })
  genero?: string;

  @ApiProperty({ required: false, example: 'chaquetas' })
  categoria?: string;

  @ApiProperty({ required: false, example: 'chaqueta oversize' })
  busqueda?: string;

  @ApiProperty({ required: false, example: true })
  novedad?: boolean;

  @ApiProperty({ required: false, example: true })
  oferta?: boolean;
}

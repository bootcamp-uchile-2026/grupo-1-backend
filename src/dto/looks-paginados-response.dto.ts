import { ApiProperty } from '@nestjs/swagger';
import { LookResponseDto } from './look-response.dto';

/**
 * DTO de SALIDA.
 * Pagina del listado de looks.
 */
export class LooksPaginadosResponseDto {
  @ApiProperty({
    type: [LookResponseDto],
    description: 'Looks de la pagina solicitada.',
  })
  looks: LookResponseDto[];

  @ApiProperty({
    type: Number,
    description: 'Numero de pagina devuelta.',
    example: 1,
  })
  pagina: number;

  @ApiProperty({
    type: Number,
    description: 'Cantidad maxima de looks por pagina.',
    example: 12,
  })
  limite: number;

  @ApiProperty({
    type: Number,
    description: 'Cantidad total de looks.',
    example: 4,
  })
  total: number;
}

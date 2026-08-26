import { ApiProperty } from '@nestjs/swagger';
import { ProductoResponseDto } from './producto-response.dto';
import { VarianteResponseDto } from './variante-response.dto';

export class ProductoDetalleResponseDto extends ProductoResponseDto {
  @ApiProperty({
    example: 'Chaqueta de denim de corte holgado y hombros caidos.',
  })
  descripcion: string;

  @ApiProperty({
    type: [String],
    example: [
      'https://cdn.stylenow.cl/p/12.jpg',
      'https://cdn.stylenow.cl/p/12b.jpg',
    ],
  })
  imagenes: string[];

  @ApiProperty({ type: [VarianteResponseDto] })
  variantes: VarianteResponseDto[];
}

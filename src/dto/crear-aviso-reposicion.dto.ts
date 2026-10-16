import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Aviso para cuando un producto sin stock vuelve a estar disponible.
 */
export class CrearAvisoReposicionDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador del producto.',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productoId: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Variante (color y talla) que se espera.',
    example: 101,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  varianteId?: number;
}

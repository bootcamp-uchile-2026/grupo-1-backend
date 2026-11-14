import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Alerta para avisar cuando un producto baja de precio.
 */
export class CrearAlertaPrecioDto {
  @ApiProperty({
    minimum: 1,
    type: Number,
    description: 'Identificador del producto.',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productoId: number;

  @ApiPropertyOptional({
    minimum: 1,
    type: Number,
    description: 'Precio desde el cual se avisa, en pesos chilenos.',
    example: 29990,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  precioObjetivo?: number;
}

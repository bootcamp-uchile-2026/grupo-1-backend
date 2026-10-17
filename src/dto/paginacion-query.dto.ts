import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Maximo de elementos que un listado paginado entrega por pagina. */
export const LIMITE_MAXIMO_PAGINA = 50;

/**
 * DTO de ENTRADA.
 * Query params comunes de los listados paginados.
 */
export class PaginacionQueryDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Pagina solicitada. Comienza en 1.',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({
    type: Number,
    description: 'Elementos por pagina.',
    default: 12,
    minimum: 1,
    maximum: LIMITE_MAXIMO_PAGINA,
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_PAGINA)
  limite: number = 12;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const PAGINA_POR_DEFECTO = 1;
export const LIMITE_POR_DEFECTO = 12;

/** Maximo de elementos que un listado paginado entrega por pagina. */
export const LIMITE_MAXIMO_PAGINA = 50;

/**
 * DTO de ENTRADA.
 * Query params comunes de los listados paginados.
 */
export class PaginacionQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    description: 'Pagina solicitada. Comienza en 1.',
    default: PAGINA_POR_DEFECTO,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = PAGINA_POR_DEFECTO;

  @ApiPropertyOptional({
    type: 'integer',
    description: 'Elementos por pagina.',
    default: LIMITE_POR_DEFECTO,
    minimum: 1,
    maximum: LIMITE_MAXIMO_PAGINA,
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_PAGINA)
  limite: number = LIMITE_POR_DEFECTO;
}

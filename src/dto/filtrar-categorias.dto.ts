import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { aBooleano } from './query-transformaciones';

/**
 * DTO de ENTRADA.
 * Filtro opcional de GET /categorias. Sin el, se devuelven todas.
 */
export class FiltrarCategoriasDto {
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'true devuelve solo las categorias de "Categorias populares" de la ' +
      'home; false, solo las que no lo son.',
    example: true,
  })
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  destacada?: boolean;
}

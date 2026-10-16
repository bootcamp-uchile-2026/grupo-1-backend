import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginacionQueryDto } from './paginacion-query.dto';
import { aBooleano } from './query-transformaciones';

/** Criterios de ordenamiento que acepta el catalogo. */
export const ORDENES_PRODUCTO = [
  'relevancia',
  'precio_asc',
  'precio_desc',
  'nombre_asc',
] as const;
export type OrdenProducto = (typeof ORDENES_PRODUCTO)[number];

/** Una cadena numerica vacia no es el valor cero; debe fallar IsInt. */
const aNumeroQuery = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string' && value.trim() === '') return Number.NaN;
  return typeof value === 'string' ? Number(value) : value;
};

/**
 * DTO de ENTRADA.
 * Filtros opcionales del catalogo que llegan como query params en
 * GET /productos, mas la paginacion comun (pagina y limite). Si no se envia
 * ninguno, el endpoint devuelve la primera pagina del catalogo completo.
 * Los filtros se combinan con AND.
 */
export class FiltrarProductosDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Texto del buscador del header. Coincidencia parcial en nombre o ' +
      'descripcion, sin distinguir mayusculas ni tildes.',
    example: 'vestido',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Slug de la categoria, obtenido desde GET /categorias. Una categoria ' +
      'sin productos devuelve un listado vacio.',
    example: 'mujer',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoria?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Talla con stock disponible en alguna variante del producto.',
    example: 'M',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  talla?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Color con stock disponible en alguna variante del producto. Si se ' +
      'envia junto con talla, la misma variante debe cumplir ambos.',
    example: 'Beige',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  color?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Precio minimo en pesos chilenos, sin decimales. Inclusivo.',
    minimum: 0,
    example: 10000,
  })
  @IsOptional()
  @Transform(aNumeroQuery)
  @IsInt()
  @Min(0)
  precioMin?: number;

  @ApiPropertyOptional({
    type: Number,
    description:
      'Precio maximo en pesos chilenos, sin decimales. Inclusivo. No puede ' +
      'ser menor que precioMin.',
    minimum: 0,
    example: 40000,
  })
  @IsOptional()
  @Transform(aNumeroQuery)
  @IsInt()
  @Min(0)
  precioMax?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'true devuelve solo los productos de la nueva coleccion; false, solo ' +
      'los que no lo son.',
    example: true,
  })
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  novedad?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'true devuelve solo los productos en oferta; false, solo los que no ' +
      'lo estan.',
    example: false,
  })
  @IsOptional()
  @Transform(aBooleano)
  @IsBoolean()
  oferta?: boolean;

  @ApiPropertyOptional({
    enum: ORDENES_PRODUCTO,
    description:
      'Criterio de ordenamiento. relevancia es el orden propio del catalogo.',
    default: 'relevancia',
    example: 'precio_asc',
  })
  @IsOptional()
  @IsIn(ORDENES_PRODUCTO)
  orden?: OrdenProducto;
}

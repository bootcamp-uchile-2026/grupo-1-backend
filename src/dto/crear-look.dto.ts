import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * DTO de ENTRADA.
 * Producto y variante que forman parte de un look.
 */
export class LookProductoDto {
  @ApiProperty({
    minimum: 1,
    type: 'integer',
    description: 'Identificador del producto.',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  productoId!: number;

  @ApiProperty({
    minimum: 1,
    type: 'integer',
    description: 'Identificador de la variante elegida.',
    example: 101,
  })
  @IsInt()
  @IsPositive()
  varianteId!: number;
}

/**
 * DTO de ENTRADA.
 * Look armado por el usuario a partir de productos del catalogo.
 */
export class CrearLookDto {
  @ApiProperty({
    minLength: 1,
    type: String,
    description: 'Nombre del look.',
    example: 'Look urbano',
  })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({
    type: [LookProductoDto],
    minItems: 1,
    description: 'Productos que componen el look.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LookProductoDto)
  productos!: LookProductoDto[];
}

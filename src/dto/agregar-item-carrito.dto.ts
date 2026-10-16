import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Cuerpo del boton "Agregar al carrito" de la ficha de producto.
 * Se envia la variante y no el producto porque la ficha obliga a elegir
 * color y talla antes de agregar.
 */
export class AgregarItemCarritoDto {
  @ApiProperty({
    type: Number,
    title: 'Identificador de variante',
    description:
      'Variante seleccionada en la ficha, es decir la combinacion de color y talla.',
    example: 101,
    required: true,
  })
  @IsInt()
  @IsPositive()
  varianteId: number;

  @ApiProperty({
    type: Number,
    title: 'Cantidad',
    description: 'Unidades que se agregan al carrito. Debe ser mayor que cero.',
    example: 2,
    required: true,
  })
  @IsInt()
  @IsPositive()
  cantidad: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

/**
 * DTO de ENTRADA.
 * Look que el usuario guarda en su cuenta.
 */
export class GuardarLookDto {
  @ApiProperty({
    minimum: 1,
    type: Number,
    description: 'Identificador del look que se guarda.',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  lookId!: number;
}

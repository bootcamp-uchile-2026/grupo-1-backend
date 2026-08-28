import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de SALIDA.
 * Respuesta generica de confirmacion usada por POST /auth/logout.
 */
export class MensajeResponseDto {
  @ApiProperty({
    type: String,
    title: 'Mensaje',
    description: 'Texto de confirmacion de la operacion.',
    example: 'Sesion cerrada correctamente',
    required: true,
  })
  mensaje: string;
}

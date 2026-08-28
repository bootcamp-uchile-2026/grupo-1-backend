import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de ENTRADA.
 * Cuerpo del formulario "Iniciar sesion" del header.
 */
export class LoginDto {
  @ApiProperty({
    type: String,
    title: 'Correo electronico',
    description:
      'Correo electronico registrado previamente en POST /auth/registro.',
    example: 'cliente@stylenow.cl',
    required: true,
  })
  correoElectronico: string;

  @ApiProperty({
    type: String,
    title: 'Contrasena',
    description: 'Contrasena de la cuenta.',
    example: 'StyleNow2026',
    required: true,
  })
  contrasena: string;
}

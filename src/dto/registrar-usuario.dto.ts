import { ApiProperty } from '@nestjs/swagger';

export class RegistrarUsuarioDto {
  @ApiProperty({ example: 'Ana Rojas' })
  nombre: string;

  @ApiProperty({ example: 'ana@mail.com' })
  correoElectronico: string;

  @ApiProperty({ example: 'stylenow123' })
  contrasena: string;
}

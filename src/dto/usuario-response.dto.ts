import { ApiProperty } from '@nestjs/swagger';

// La contrasena nunca forma parte de este contrato.
export class UsuarioResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ana Rojas' })
  nombre: string;

  @ApiProperty({ example: 'ana@mail.com' })
  correoElectronico: string;
}

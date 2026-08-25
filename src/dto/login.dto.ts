import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ana@mail.com' })
  correoElectronico: string;

  @ApiProperty({ example: 'stylenow123' })
  contrasena: string;
}

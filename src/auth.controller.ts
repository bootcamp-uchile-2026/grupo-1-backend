import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { UsuarioResponseDto } from './dto/usuario-response.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Registra un nuevo usuario',
    description:
      'Registro basico del Hito 1. Sin JWT, sin hash de contrasena y sin guards.',
  })
  @ApiBody({
    description: 'Datos del formulario de registro',
    type: RegistrarUsuarioDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente',
    type: UsuarioResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El correo electronico ya se encuentra registrado',
  })
  @Post('registro')
  registrar(@Body() registrarUsuarioDto: RegistrarUsuarioDto) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }

  @ApiOperation({
    summary: 'Inicia sesion',
    description:
      'Validacion basica de credenciales. La respuesta no incluye token.',
  })
  @ApiBody({ description: 'Credenciales del usuario', type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesion exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Correo electronico o contrasena invalidos',
  })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    // PLACEHOLDER: la logica se implementa en la siguiente fase.
  }
}

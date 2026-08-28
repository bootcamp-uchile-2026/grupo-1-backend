import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { MensajeResponseDto } from '../dto/mensaje-response.dto';
import { RegistrarUsuarioDto } from '../dto/registrar-usuario.dto';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { AuthService } from '../services/auth.service';

/**
 * Recurso Auth.
 * Cubre los accesos "Crear cuenta" e "Iniciar sesion" del header.
 * Hito 1 no implementa JWT, hashing de contrasenas, guards ni sesiones de
 * servidor: estos endpoints definen el contrato HTTP que consumira el
 * frontend y guardan los usuarios en memoria.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Registra una cuenta nueva',
    description:
      'Crea la cuenta del formulario "Crear cuenta" del header. El correo electronico ' +
      'identifica la cuenta y no se puede repetir. La respuesta nunca incluye la contrasena. ' +
      'En Hito 1 la contrasena se guarda en memoria sin hashing porque ese contenido aun no ' +
      'forma parte del curso.',
  })
  @ApiBody({
    description: 'Datos del formulario de registro.',
    type: RegistrarUsuarioDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Cuenta creada correctamente.',
    type: UsuarioResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Falta alguno de los campos obligatorios.',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una cuenta con ese correo electronico.',
  })
  @Post('registro')
  registrar(@Body() dto: RegistrarUsuarioDto): UsuarioResponseDto {
    return this.authService.registrar(dto);
  }

  @ApiOperation({
    summary: 'Inicia sesion',
    description:
      'Valida el correo electronico y la contrasena del formulario "Iniciar sesion". ' +
      'La respuesta devuelve un mensaje y los datos publicos del usuario. No devuelve token ' +
      'ni accessToken porque JWT esta fuera del alcance de Hito 1.',
  })
  @ApiBody({
    description: 'Credenciales del formulario de inicio de sesion.',
    type: LoginDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesion correcto.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Correo electronico o contrasena incorrectos.',
  })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto): AuthResponseDto {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'Cierra la sesion del frontend',
    description:
      'Devuelve la confirmacion de cierre de sesion que el header necesita para volver al ' +
      'estado de visitante. IMPORTANTE: Hito 1 no implementa JWT ni sesiones de servidor, ' +
      'por lo tanto este endpoint representa el contrato de cierre de sesion del frontend ' +
      'pero no invalida ningun token ni ninguna sesion en el servidor. El frontend es quien ' +
      'descarta los datos del usuario que mantiene localmente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cierre de sesion confirmado.',
    type: MensajeResponseDto,
  })
  @HttpCode(200)
  @Post('logout')
  cerrarSesion(): MensajeResponseDto {
    return this.authService.cerrarSesion();
  }
}

import { Publico } from '../seguridad/publico.decorator';
import { ErrorResponseDto } from '../dto/error-response.dto';
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
 * Cubre los accesos "Crear cuenta" e "Iniciar sesion" del header. Rutas
 * publicas. Desde H3-P2 las contrasenas se guardan solo como hash scrypt y
 * el login emite un JWT que exigen las rutas de usuario (AutenticacionGuard).
 */
@ApiTags('auth')
@Publico()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Registra una cuenta nueva',
    description:
      'Crea la cuenta del formulario "Crear cuenta" del header, junto con su carrito ' +
      'vacio. El correo electronico identifica la cuenta y no se puede repetir (se compara ' +
      'sin distinguir mayusculas). El perfil nace con apellido vacio, que se completa en ' +
      'PATCH /usuarios/{usuarioId}. La respuesta nunca incluye la contrasena; ' +
      'solo se guarda su hash scrypt. Usuario y credencial se crean en una misma transaccion.',
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
    type: ErrorResponseDto,
    status: 400,
    description:
      'Falta alguno de los campos obligatorios, el correo no es valido o se envian ' +
      'campos no declarados.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 409,
    description: 'Ya existe una cuenta con ese correo electronico.',
  })
  @Post('registro')
  async registrar(
    @Body() dto: RegistrarUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    return this.authService.registrar(dto);
  }

  @ApiOperation({
    summary: 'Inicia sesion',
    description:
      'Valida el correo electronico y la contrasena del formulario "Iniciar sesion". ' +
      'La respuesta devuelve un mensaje, los datos publicos del usuario y un JWT HS256 ' +
      '(accessToken, tipoToken Bearer, expiraEnSegundos). Enviar Authorization: Bearer ' +
      '<accessToken> en las rutas /usuarios/{usuarioId}/..., POST /pedidos y POST /looks.',
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
    type: ErrorResponseDto,
    status: 400,
    description: 'Falta el correo o la contrasena, o el correo no es valido.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 401,
    description: 'Correo electronico o contrasena incorrectos.',
  })
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'Cierra la sesion del frontend',
    description:
      'Devuelve la confirmacion de cierre de sesion que el header necesita para volver al ' +
      'estado de visitante. IMPORTANTE: el JWT es sin estado; ' +
      'este endpoint no revoca el token en el servidor (la revocacion esta pendiente de ' +
      'decision). El frontend descarta el token y los datos del usuario; el token vence ' +
      'por expiracion.',
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

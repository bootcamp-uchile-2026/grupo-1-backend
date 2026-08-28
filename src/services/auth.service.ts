import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { MensajeResponseDto } from '../dto/mensaje-response.dto';
import { RegistrarUsuarioDto } from '../dto/registrar-usuario.dto';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';

/**
 * Usuario tal como se guarda en memoria.
 * Es interno del servicio: la contrasena nunca sale en un DTO de salida.
 */
interface UsuarioEnMemoria {
  id: number;
  nombre: string;
  correoElectronico: string;
  contrasena: string;
}

/**
 * Registro e inicio de sesion de StyleNow.
 * Hito 1 no usa base de datos, JWT, sesiones de servidor ni hashing:
 * los usuarios viven en memoria mientras la aplicacion esta levantada.
 */
@Injectable()
export class AuthService {
  private readonly usuarios: UsuarioEnMemoria[] = [
    {
      id: 1,
      nombre: 'Fernanda Rojas',
      correoElectronico: 'cliente@stylenow.cl',
      contrasena: 'StyleNow2026',
    },
  ];

  private siguienteId = 2;

  /** Crea una cuenta nueva. El correo electronico no se puede repetir. */
  registrar(dto: RegistrarUsuarioDto): UsuarioResponseDto {
    const nombre = (dto?.nombre ?? '').trim();
    const correoElectronico = (dto?.correoElectronico ?? '')
      .trim()
      .toLowerCase();
    const contrasena = dto?.contrasena ?? '';

    if (!nombre || !correoElectronico || !contrasena) {
      throw new BadRequestException(
        'nombre, correoElectronico y contrasena son obligatorios',
      );
    }
    if (this.buscarPorCorreo(correoElectronico)) {
      throw new ConflictException(
        'Ya existe una cuenta registrada con ese correo electronico',
      );
    }

    const usuario: UsuarioEnMemoria = {
      id: this.siguienteId,
      nombre,
      correoElectronico,
      contrasena,
    };
    this.siguienteId += 1;
    this.usuarios.push(usuario);
    return this.aRespuesta(usuario);
  }

  /** Valida las credenciales del formulario de inicio de sesion. */
  login(dto: LoginDto): AuthResponseDto {
    const correoElectronico = (dto?.correoElectronico ?? '')
      .trim()
      .toLowerCase();
    const contrasena = dto?.contrasena ?? '';
    const usuario = this.buscarPorCorreo(correoElectronico);

    if (!usuario || usuario.contrasena !== contrasena) {
      throw new UnauthorizedException(
        'Correo electronico o contrasena incorrectos',
      );
    }

    return {
      mensaje: 'Inicio de sesion correcto',
      usuario: this.aRespuesta(usuario),
    };
  }

  /**
   * Confirma el cierre de sesion.
   * Hito 1 no mantiene estado de sesion en el servidor, por lo que este
   * metodo solo devuelve el mensaje que el frontend muestra al limpiar
   * sus propios datos locales.
   */
  cerrarSesion(): MensajeResponseDto {
    return { mensaje: 'Sesion cerrada correctamente' };
  }

  /**
   * Comprueba que el usuario de la ruta exista.
   * Lo usan CarritoService y FavoritosService, que trabajan siempre
   * dentro del contexto de un usuario.
   */
  obtenerUsuarioPorId(usuarioId: string | number): UsuarioResponseDto {
    const id = Number(usuarioId);
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException(
        'usuarioId debe ser un entero mayor que cero',
      );
    }
    const usuario = this.usuarios.find((item) => item.id === id);
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario con id ${id}`);
    }
    return this.aRespuesta(usuario);
  }

  private buscarPorCorreo(
    correoElectronico: string,
  ): UsuarioEnMemoria | undefined {
    return this.usuarios.find(
      (usuario) => usuario.correoElectronico === correoElectronico,
    );
  }

  /** Convierte el usuario en memoria en el DTO de salida, sin la contrasena. */
  private aRespuesta(usuario: UsuarioEnMemoria): UsuarioResponseDto {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correoElectronico: usuario.correoElectronico,
    };
  }
}

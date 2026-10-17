import { Injectable } from '@nestjs/common';
import {
  ConflictoDominioError,
  CredencialesInvalidasError,
} from '../dominio/errores-dominio';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { MensajeResponseDto } from '../dto/mensaje-response.dto';
import { RegistrarUsuarioDto } from '../dto/registrar-usuario.dto';
import { UsuarioResponseDto } from '../dto/usuario-response.dto';
import { CredencialesRepository } from '../repositorios/credenciales.repository';
import { CarritoService } from './carrito.service';
import { UsuariosService } from './usuarios.service';

/** Mensaje unico de login fallido: no revela si el correo existe. */
const CREDENCIALES_INCORRECTAS = 'Correo electronico o contrasena incorrectos';

/** Correo comparable: sin espacios en los extremos y en minusculas. */
export const normalizarCorreo = (correo: string): string =>
  correo.trim().toLowerCase();

/**
 * Registro e inicio de sesion de StyleNow (fase dummy).
 * No emite tokens ni mantiene sesiones: el registro crea el usuario, su
 * credencial privada y su carrito vacio; el login valida la credencial y
 * devuelve los datos publicos. La contrasena nunca sale de este servicio.
 */
@Injectable()
export class AuthService {
  /** Registros en curso, en orden, para que dos altas no tomen el mismo correo. */
  private colaRegistros: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly credenciales: CredencialesRepository,
    private readonly usuariosService: UsuariosService,
    private readonly carritoService: CarritoService,
  ) {}

  /**
   * Crea una cuenta nueva con su carrito vacio.
   * El registro no recibe apellido: el perfil nace con apellido vacio y el
   * usuario puede completarlo despues con PATCH /usuarios/{id}.
   */
  async registrar(datos: RegistrarUsuarioDto): Promise<UsuarioResponseDto> {
    const resultado = this.colaRegistros.then(() =>
      this.registrarEnOrden(datos),
    );
    this.colaRegistros = resultado.catch(() => undefined);
    return resultado;
  }

  /** Valida las credenciales del formulario de inicio de sesion. */
  async login(datos: LoginDto): Promise<AuthResponseDto> {
    const credencial = await this.credenciales.buscarPorCorreo(
      normalizarCorreo(datos.correoElectronico),
    );
    if (!credencial || credencial.contrasena !== datos.contrasena) {
      throw new CredencialesInvalidasError(CREDENCIALES_INCORRECTAS);
    }
    const usuario = await this.usuariosService.obtenerUsuario(
      credencial.usuarioId,
    );
    return {
      mensaje: 'Inicio de sesion correcto',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correoElectronico: usuario.email,
      },
    };
  }

  /**
   * Confirma el cierre de sesion. No hay token ni sesion de servidor que
   * invalidar: el frontend descarta los datos del usuario.
   */
  cerrarSesion(): MensajeResponseDto {
    return { mensaje: 'Sesion cerrada' };
  }

  private async registrarEnOrden(
    datos: RegistrarUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    const correo = normalizarCorreo(datos.correoElectronico);
    if (await this.credenciales.buscarPorCorreo(correo)) {
      throw new ConflictoDominioError(
        'Ya existe una cuenta con ese correo electronico',
      );
    }
    const usuario = await this.usuariosService.crearUsuario({
      nombre: datos.nombre,
      apellido: '',
      email: correo,
    });
    const creada = await this.credenciales.crear({
      usuarioId: usuario.id,
      correo,
      contrasena: datos.contrasena,
    });
    if (!creada) {
      throw new ConflictoDominioError(
        'Ya existe una cuenta con ese correo electronico',
      );
    }
    await this.carritoService.crearCarrito(usuario.id);
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correoElectronico: usuario.email,
    };
  }
}

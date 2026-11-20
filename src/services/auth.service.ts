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
import { UsuarioDetalleResponseDto } from '../dto/usuario-detalle-response.dto';
import { CredencialesRepository } from '../repositorios/credenciales.repository';
import { UnidadDeTrabajo } from '../persistencia/unidad-de-trabajo';
import { ServicioContrasenas } from '../seguridad/contrasenas';
import { ServicioTokens } from '../seguridad/tokens';
import { CarritoService } from './carrito.service';
import { UsuariosService } from './usuarios.service';

/** Mensaje unico de login fallido: no revela si el correo existe. */
const CREDENCIALES_INCORRECTAS = 'Correo electronico o contrasena incorrectos';
const CORREO_REPETIDO = 'Ya existe una cuenta con ese correo electronico';

/** Correo comparable: sin espacios en los extremos y en minusculas. */
export const normalizarCorreo = (correo: string): string =>
  correo.trim().toLowerCase();

/**
 * Registro e inicio de sesion de StyleNow.
 * En MySQL, usuario, credencial y carrito se crean en la misma unidad de
 * trabajo: se confirman o revierten juntos. El hash scrypt se calcula antes
 * de abrir la transaccion. El login verifica el hash en tiempo constante
 * y emite un JWT HS256; la contrasena en claro no se persiste ni se publica.
 */
@Injectable()
export class AuthService {
  /** Registros en curso, en orden, para que dos altas no tomen el mismo correo. */
  private colaRegistros: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly credenciales: CredencialesRepository,
    private readonly usuariosService: UsuariosService,
    private readonly carritoService: CarritoService,
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly contrasenas: ServicioContrasenas,
    private readonly tokens: ServicioTokens,
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
    const valida = credencial
      ? await this.contrasenas.verificar(
          datos.contrasena,
          credencial.hashContrasena,
        )
      : await this.contrasenas.verificarSinCuenta(datos.contrasena);
    if (!credencial || !valida) {
      throw new CredencialesInvalidasError(CREDENCIALES_INCORRECTAS);
    }
    const usuario = await this.usuariosService.obtenerUsuario(
      credencial.usuarioId,
    );
    const emitido = this.tokens.firmar(usuario.id);
    return {
      mensaje: 'Inicio de sesion correcto',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correoElectronico: usuario.email,
      },
      accessToken: emitido.token,
      tipoToken: 'Bearer',
      expiraEnSegundos: emitido.expiraEnSegundos,
    };
  }

  /**
   * Confirma el cierre de sesion. El JWT es sin estado: el frontend descarta
   * el token y vence por expiracion. Revocar tokens en el servidor es una
   * decision pendiente (lista de revocacion no aprobada).
   */
  cerrarSesion(): MensajeResponseDto {
    return { mensaje: 'Sesion cerrada' };
  }

  private async registrarEnOrden(
    datos: RegistrarUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    const correo = normalizarCorreo(datos.correoElectronico);
    if (await this.credenciales.buscarPorCorreo(correo)) {
      throw new ConflictoDominioError(CORREO_REPETIDO);
    }
    // Hash fuera de la transaccion: no mantener filas bloqueadas ~100 ms.
    const hashContrasena = await this.contrasenas.hash(datos.contrasena);
    let usuario: UsuarioDetalleResponseDto;
    try {
      usuario = await this.unidadDeTrabajo.ejecutar(async () => {
        const creado = await this.usuariosService.crearUsuario({
          nombre: datos.nombre,
          apellido: '',
          email: correo,
        });
        const creada = await this.credenciales.crear({
          usuarioId: creado.id,
          correo,
          hashContrasena,
        });
        if (!creada) throw new ConflictoDominioError(CORREO_REPETIDO);
        await this.carritoService.crearCarrito(creado.id);
        return creado;
      });
    } catch (error) {
      // Unicidad SQL (1062) bajo concurrencia: mismo 409 que el chequeo previo.
      if (error instanceof ConflictoDominioError) {
        throw new ConflictoDominioError(CORREO_REPETIDO);
      }
      throw error;
    }
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correoElectronico: usuario.email,
    };
  }
}

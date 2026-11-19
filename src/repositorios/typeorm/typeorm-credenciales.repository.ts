import { DataSource } from 'typeorm';
import { gestorActual } from '../../persistencia/gestor-actual';
import { CredencialFila } from '../../persistencia/identidad.entidades';
import {
  CredencialesRepository,
  CredencialPersistida,
} from '../credenciales.repository';

const ID_MAXIMO = 4294967295;

const aCredencial = (fila: CredencialFila): CredencialPersistida => ({
  usuarioId: fila.usuarioId,
  correo: fila.correo,
  hashContrasena: fila.hashContrasena,
});

/** Credenciales en MySQL: solo hash. Participa de la UoW activa si existe. */
export class TypeOrmCredencialesRepository extends CredencialesRepository {
  constructor(private readonly source: DataSource) {
    super();
  }

  async buscarPorCorreo(correo: string): Promise<CredencialPersistida | null> {
    const fila = await gestorActual(this.source)
      .getRepository(CredencialFila)
      .findOneBy({ correo });
    return fila ? aCredencial(fila) : null;
  }

  async buscarPorUsuario(
    usuarioId: number,
  ): Promise<CredencialPersistida | null> {
    if (
      !Number.isSafeInteger(usuarioId) ||
      usuarioId < 1 ||
      usuarioId > ID_MAXIMO
    )
      return null;
    const fila = await gestorActual(this.source)
      .getRepository(CredencialFila)
      .findOneBy({ usuarioId });
    return fila ? aCredencial(fila) : null;
  }

  /** false ante correo o usuario repetido (1062), como el adaptador dummy. */
  async crear(credencial: CredencialPersistida): Promise<boolean> {
    try {
      await gestorActual(this.source).getRepository(CredencialFila).insert({
        usuarioId: credencial.usuarioId,
        correo: credencial.correo,
        hashContrasena: credencial.hashContrasena,
      });
      return true;
    } catch (error) {
      const errno = (error as { driverError?: { errno?: number } }).driverError
        ?.errno;
      if (errno === 1062) return false;
      throw error;
    }
  }

  async actualizarContrasena(
    usuarioId: number,
    hashContrasena: string,
  ): Promise<boolean> {
    if (
      !Number.isSafeInteger(usuarioId) ||
      usuarioId < 1 ||
      usuarioId > ID_MAXIMO
    )
      return false;
    const resultado = await gestorActual(this.source)
      .getRepository(CredencialFila)
      .update({ usuarioId }, { hashContrasena });
    return (resultado.affected ?? 0) > 0;
  }
}

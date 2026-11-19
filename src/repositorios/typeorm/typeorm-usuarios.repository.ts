import { DataSource } from 'typeorm';
import type { Usuario } from '../../dominio/modelos';
import { gestorActual } from '../../persistencia/gestor-actual';
import { traducirErrorMysql } from '../../persistencia/errores-mysql';
import { UsuarioFila } from '../../persistencia/identidad.entidades';
import {
  CambiosUsuario,
  NuevoUsuario,
  UsuariosRepository,
} from '../usuarios.repository';

const ID_MAXIMO = 4294967295; // INT UNSIGNED

export const aUsuario = (fila: UsuarioFila): Usuario => ({
  id: fila.id,
  nombre: fila.nombre,
  apellido: fila.apellido,
  email: fila.email,
  ...(fila.telefono === null ? {} : { telefono: fila.telefono }),
});

/** Perfiles en MySQL; participa de la UoW activa si existe. */
export class TypeOrmUsuariosRepository extends UsuariosRepository {
  constructor(private readonly source: DataSource) {
    super();
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    if (!Number.isSafeInteger(id) || id < 1 || id > ID_MAXIMO) return null;
    const fila = await gestorActual(this.source)
      .getRepository(UsuarioFila)
      .findOneBy({ id });
    return fila ? aUsuario(fila) : null;
  }

  async actualizar(
    id: number,
    cambios: CambiosUsuario,
  ): Promise<Usuario | null> {
    if (!Number.isSafeInteger(id) || id < 1 || id > ID_MAXIMO) return null;
    const repositorio = gestorActual(this.source).getRepository(UsuarioFila);
    const resultado = await repositorio.update(
      { id },
      {
        nombre: cambios.nombre,
        apellido: cambios.apellido,
        telefono: cambios.telefono ?? null,
      },
    );
    if (!resultado.affected) {
      // MySQL informa 0 filas cambiadas si los valores eran iguales.
      const fila = await repositorio.findOneBy({ id });
      return fila ? aUsuario(fila) : null;
    }
    return aUsuario(await repositorio.findOneByOrFail({ id }));
  }

  async crear(datos: NuevoUsuario): Promise<Usuario> {
    const repositorio = gestorActual(this.source).getRepository(UsuarioFila);
    try {
      const { identifiers } = await repositorio.insert({
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono ?? null,
      });
      const id = Number((identifiers[0] as { id: number | string }).id);
      return aUsuario(await repositorio.findOneByOrFail({ id }));
    } catch (error) {
      traducirErrorMysql(error);
    }
  }
}

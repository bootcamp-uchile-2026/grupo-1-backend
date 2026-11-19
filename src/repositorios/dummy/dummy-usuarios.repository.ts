import type { Usuario } from '../../dominio/modelos';
import { Injectable } from '@nestjs/common';
import { USUARIOS_DUMMY } from '../../data/usuarios.dummy';

import {
  CambiosUsuario,
  NuevoUsuario,
  UsuariosRepository,
} from '../usuarios.repository';
import { copiar } from './reiniciable';

@Injectable()
export class DummyUsuariosRepository extends UsuariosRepository {
  private usuarios: Usuario[] = [];
  private siguienteId = 0;

  constructor() {
    super();
    this.usuarios = copiar(USUARIOS_DUMMY);
    this.siguienteId = Math.max(0, ...this.usuarios.map((u) => u.id)) + 1;
  }

  buscarPorId(id: number): Promise<Usuario | null> {
    const usuario = this.usuarios.find((item) => item.id === id);
    return Promise.resolve(usuario ? copiar(usuario) : null);
  }

  actualizar(id: number, cambios: CambiosUsuario): Promise<Usuario | null> {
    const posicion = this.usuarios.findIndex((item) => item.id === id);
    if (posicion === -1) return Promise.resolve(null);
    this.usuarios[posicion] = { ...this.usuarios[posicion], ...cambios };
    return Promise.resolve(copiar(this.usuarios[posicion]));
  }

  crear(datos: NuevoUsuario): Promise<Usuario> {
    const usuario: Usuario = {
      id: this.siguienteId,
      ...copiar(datos),
    };
    this.siguienteId += 1;
    this.usuarios.push(usuario);
    return Promise.resolve(copiar(usuario));
  }
}

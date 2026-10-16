import { Injectable } from '@nestjs/common';
import { USUARIOS_DUMMY } from '../../data/usuarios.dummy';
import { UsuarioDetalleResponseDto } from '../../dto/usuario-detalle-response.dto';
import {
  CambiosUsuario,
  NuevoUsuario,
  UsuariosRepository,
} from '../usuarios.repository';
import { copiar, RepositorioReiniciable } from './reiniciable';

@Injectable()
export class DummyUsuariosRepository
  extends UsuariosRepository
  implements RepositorioReiniciable
{
  private usuarios: UsuarioDetalleResponseDto[] = [];
  private siguienteId = 0;

  constructor() {
    super();
    this.reiniciar();
  }

  reiniciar(): void {
    this.usuarios = copiar(USUARIOS_DUMMY);
    this.siguienteId = Math.max(0, ...this.usuarios.map((u) => u.id)) + 1;
  }

  buscarPorId(id: number): Promise<UsuarioDetalleResponseDto | null> {
    const usuario = this.usuarios.find((item) => item.id === id);
    return Promise.resolve(usuario ? copiar(usuario) : null);
  }

  actualizar(
    id: number,
    cambios: CambiosUsuario,
  ): Promise<UsuarioDetalleResponseDto | null> {
    const posicion = this.usuarios.findIndex((item) => item.id === id);
    if (posicion === -1) return Promise.resolve(null);
    this.usuarios[posicion] = { ...this.usuarios[posicion], ...cambios };
    return Promise.resolve(copiar(this.usuarios[posicion]));
  }

  crear(datos: NuevoUsuario): Promise<UsuarioDetalleResponseDto> {
    const usuario: UsuarioDetalleResponseDto = {
      id: this.siguienteId,
      ...copiar(datos),
    };
    this.siguienteId += 1;
    this.usuarios.push(usuario);
    return Promise.resolve(copiar(usuario));
  }
}

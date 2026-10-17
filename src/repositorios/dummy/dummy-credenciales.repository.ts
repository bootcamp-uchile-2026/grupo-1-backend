import { Injectable } from '@nestjs/common';
import { CREDENCIALES_DUMMY } from '../../data/credenciales.dummy';
import {
  CredencialesRepository,
  CredencialPersistida,
} from '../credenciales.repository';
import { copiar, RepositorioReiniciable } from './reiniciable';

@Injectable()
export class DummyCredencialesRepository
  extends CredencialesRepository
  implements RepositorioReiniciable
{
  private credenciales: CredencialPersistida[] = [];

  constructor() {
    super();
    this.reiniciar();
  }

  reiniciar(): void {
    this.credenciales = copiar(CREDENCIALES_DUMMY);
  }

  buscarPorCorreo(correo: string): Promise<CredencialPersistida | null> {
    const credencial = this.credenciales.find((item) => item.correo === correo);
    return Promise.resolve(credencial ? copiar(credencial) : null);
  }

  buscarPorUsuario(usuarioId: number): Promise<CredencialPersistida | null> {
    const credencial = this.credenciales.find(
      (item) => item.usuarioId === usuarioId,
    );
    return Promise.resolve(credencial ? copiar(credencial) : null);
  }

  crear(credencial: CredencialPersistida): Promise<boolean> {
    const repetida = this.credenciales.some(
      (item) =>
        item.correo === credencial.correo ||
        item.usuarioId === credencial.usuarioId,
    );
    if (repetida) return Promise.resolve(false);
    this.credenciales.push(copiar(credencial));
    return Promise.resolve(true);
  }

  actualizarContrasena(
    usuarioId: number,
    contrasena: string,
  ): Promise<boolean> {
    const credencial = this.credenciales.find(
      (item) => item.usuarioId === usuarioId,
    );
    if (!credencial) return Promise.resolve(false);
    credencial.contrasena = contrasena;
    return Promise.resolve(true);
  }
}

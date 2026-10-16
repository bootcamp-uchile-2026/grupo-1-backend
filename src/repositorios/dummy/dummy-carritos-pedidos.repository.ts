import { Injectable } from '@nestjs/common';
import { CARRITOS_DUMMY } from '../../data/carritos.dummy';
import {
  CarritoPersistido,
  CarritosRepository,
  LineaCarritoPersistida,
} from '../carritos.repository';
import { copiar, RepositorioReiniciable } from './reiniciable';

@Injectable()
export class DummyCarritosRepository
  extends CarritosRepository
  implements RepositorioReiniciable
{
  private carritos: CarritoPersistido[] = [];
  private siguienteId = 0;

  constructor() {
    super();
    this.reiniciar();
  }

  reiniciar(): void {
    this.carritos = copiar(CARRITOS_DUMMY);
    this.siguienteId = Math.max(0, ...this.carritos.map((c) => c.id)) + 1;
  }

  crearParaUsuario(usuarioId: number): Promise<CarritoPersistido> {
    const existente = this.carritos.find(
      (item) => item.usuarioId === usuarioId,
    );
    if (existente) return Promise.resolve(copiar(existente));
    const carrito: CarritoPersistido = {
      id: this.siguienteId,
      usuarioId,
      items: [],
    };
    this.siguienteId += 1;
    this.carritos.push(carrito);
    return Promise.resolve(copiar(carrito));
  }

  buscarPorUsuario(usuarioId: number): Promise<CarritoPersistido | null> {
    const carrito = this.carritos.find((item) => item.usuarioId === usuarioId);
    return Promise.resolve(carrito ? copiar(carrito) : null);
  }

  buscarPorId(carritoId: number): Promise<CarritoPersistido | null> {
    const carrito = this.buscar(carritoId);
    return Promise.resolve(carrito ? copiar(carrito) : null);
  }

  guardarCantidad(
    carritoId: number,
    varianteId: number,
    cantidad: number,
  ): Promise<CarritoPersistido | null> {
    const carrito = this.buscar(carritoId);
    if (!carrito) return Promise.resolve(null);
    const linea = carrito.items.find((item) => item.varianteId === varianteId);
    if (linea) {
      linea.cantidad = cantidad;
    } else {
      carrito.items.push({ varianteId, cantidad });
    }
    return Promise.resolve(copiar(carrito));
  }

  eliminarItem(carritoId: number, varianteId: number): Promise<boolean> {
    const carrito = this.buscar(carritoId);
    const posicion =
      carrito?.items.findIndex((item) => item.varianteId === varianteId) ?? -1;
    if (!carrito || posicion === -1) return Promise.resolve(false);
    carrito.items.splice(posicion, 1);
    return Promise.resolve(true);
  }

  vaciar(carritoId: number): Promise<boolean> {
    const carrito = this.buscar(carritoId);
    if (!carrito) return Promise.resolve(false);
    carrito.items = [];
    return Promise.resolve(true);
  }

  restaurarItems(
    carritoId: number,
    items: LineaCarritoPersistida[],
  ): Promise<boolean> {
    const carrito = this.buscar(carritoId);
    if (!carrito) return Promise.resolve(false);
    carrito.items = copiar(items);
    return Promise.resolve(true);
  }

  private buscar(carritoId: number): CarritoPersistido | undefined {
    return this.carritos.find((item) => item.id === carritoId);
  }
}

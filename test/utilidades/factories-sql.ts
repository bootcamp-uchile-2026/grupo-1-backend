import { randomBytes, randomInt } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Categoria } from '../../src/persistencia/entidades';
import {
  Producto,
  Variante,
  ProductoImagen,
} from '../../src/persistencia/productos.entidades';
import { UnidadDeTrabajoTypeorm } from '../../src/persistencia/unidad-de-trabajo';
import { gestorActual } from '../../src/persistencia/gestor-actual';
import { TypeOrmUsuariosRepository } from '../../src/repositorios/typeorm/typeorm-usuarios.repository';
import { TypeOrmCredencialesRepository } from '../../src/repositorios/typeorm/typeorm-credenciales.repository';
import { TypeOrmCarritosRepository } from '../../src/repositorios/typeorm/typeorm-carritos.repository';
import { TypeOrmPedidosRepository } from '../../src/repositorios/typeorm/typeorm-pedidos.repository';
import { ServicioContrasenas } from '../../src/seguridad/contrasenas';
import { exigirLaboratorio } from './guardia-laboratorio';

/** Factories explicitas: datos nuevos, IDs capturados y credenciales por caso. */
export class FactoriesSql {
  private readonly catalogos: { productoId: number; categoriaId: number }[] =
    [];
  constructor(private readonly source: DataSource) {
    this.guard();
  }
  private guard() {
    exigirLaboratorio();
    if (
      this.source.options.type !== 'mysql' ||
      this.source.options.database !== process.env.MYSQL_LAB_DATABASE ||
      this.source.options.host !== '127.0.0.1'
    )
      throw new Error('DataSource ajeno al laboratorio');
  }
  async usuario() {
    this.guard();
    const correo = randomBytes(12).toString('hex') + '@example.invalid';
    const contrasena = randomBytes(24).toString('hex');
    const hashContrasena = await new ServicioContrasenas().hash(contrasena);
    return new UnidadDeTrabajoTypeorm(this.source).ejecutar(async () => {
      const usuario = await new TypeOrmUsuariosRepository(this.source).crear({
        nombre: 'SQL01',
        apellido: 'Prueba',
        email: correo,
      });
      const creado = await new TypeOrmCredencialesRepository(this.source).crear(
        { usuarioId: usuario.id, correo, hashContrasena },
      );
      if (!creado) throw new Error('Credencial no creada');
      return { usuario, correo, contrasena };
    });
  }
  async producto(stock = 3) {
    this.guard();
    return new UnidadDeTrabajoTypeorm(this.source).ejecutar(async () => {
      const m = gestorActual(this.source),
        categoriaId = randomInt(10000, 2 ** 31),
        productoId = randomInt(10000, 2 ** 46),
        varianteId = randomInt(10000, 2 ** 46);
      await m.getRepository(Categoria).insert({
        id: categoriaId,
        nombre: 'SQL01',
        slug: 'sql01-' + randomBytes(12).toString('hex'),
        imagenUrl: 'https://example.invalid/categoria',
        destacada: false,
        orden: 99,
      });
      const producto = {
        id: productoId,
        categoriaId,
        nombre: 'Producto SQL01',
        precio: 1234,
        imagenUrl: 'https://example.invalid/portada.webp',
        novedad: false,
        oferta: false,
        descripcion: 'Sintetico aislado',
        calificacion: 0,
        guiaTallas: 'Prueba',
      };
      const variante = {
        id: varianteId,
        productoId,
        posicion: 0,
        color: 'SQL01',
        talla: 'M',
        stock,
      };
      await m.getRepository(Producto).insert(producto);
      await m.getRepository(Variante).insert(variante);
      await m.getRepository(ProductoImagen).insert({
        productoId,
        posicion: 0,
        url: 'https://example.invalid/producto.webp',
      });
      this.catalogos.push({ productoId, categoriaId });
      return { producto, variante };
    });
  }
  async pedido() {
    const cuenta = await this.usuario(),
      catalogo = await this.producto();
    const carritos = new TypeOrmCarritosRepository(this.source),
      carrito = await carritos.crearParaUsuario(cuenta.usuario.id);
    await carritos.guardarCantidad(carrito.id, catalogo.variante.id, 2);
    const checkout = {
      carritoId: carrito.id,
      contacto: { nombre: 'privado', email: cuenta.correo, telefono: '000000' },
      direccion: {
        calle: 'privada',
        numero: '1',
        comuna: 'Prueba',
        region: 'Prueba',
      },
      metodoPago: 'webpay',
    };
    const pedido = await new TypeOrmPedidosRepository(
      this.source,
    ).confirmarCheckout(
      checkout,
      cuenta.usuario.id,
      randomBytes(16).toString('hex'),
    );
    return { cuenta, catalogo, carrito, checkout, pedido };
  }
  /** Solo filas propias, despues de limpiar sus referencias en el laboratorio. */
  async limpiarCatalogos() {
    this.guard();
    for (const c of this.catalogos) {
      await this.source
        .getRepository(ProductoImagen)
        .delete({ productoId: c.productoId });
      await this.source
        .getRepository(Variante)
        .delete({ productoId: c.productoId });
      await this.source.getRepository(Producto).delete(c.productoId);
      await this.source.getRepository(Categoria).delete(c.categoriaId);
    }
    this.catalogos.length = 0;
  }
}

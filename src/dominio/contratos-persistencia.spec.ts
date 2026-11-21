import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Pedido } from './modelos';
import { aPedidoRespuesta } from '../services/respuestas.mapper';

describe('Separacion persistencia / HTTP (H2-017)', () => {
  it('impide dependencias HTTP directas o por fixtures en los puertos y modelos', () => {
    const src = join(__dirname, '..');
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? files(join(dir, entry.name))
          : [join(dir, entry.name)],
      );
    for (const dir of ['repositorios', 'data', 'dominio']) {
      for (const file of files(join(src, dir)).filter(
        (f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'),
      )) {
        const code = readFileSync(file, 'utf8');
        expect({
          file,
          importsHttp:
            /from\s+['"][^'"]*(?:\/dto\/|@nestjs\/swagger)[^'"]*['"]/.test(
              code,
            ),
        }).toEqual({ file, importsHttp: false });
      }
    }
  });

  it('conserva dueno/snapshot internamente y proyecta el pedido sin exponerlos', () => {
    const order: Pedido = {
      id: 1,
      numeroPedido: 'SN-unitario',
      usuarioId: 777,
      estado: 'confirmado',
      fecha: '2026-11-15T00:00:00.000Z',
      subtotal: 20,
      costoEnvio: 0,
      total: 20,
      metodoPago: 'webpay',
      items: [
        {
          id: 1,
          productoId: 1,
          varianteId: 101,
          nombre: 'Prueba',
          cantidad: 2,
          precioUnitario: 10,
          subtotal: 20,
        },
      ],
      checkout: {
        contacto: {
          nombre: 'privado',
          email: 'test@example.invalid',
          telefono: '000000',
        },
        direccion: {
          calle: 'privada',
          numero: '1',
          comuna: 'Prueba',
          region: 'Prueba',
        },
      },
    };
    const output = aPedidoRespuesta(order);
    expect(order.usuarioId).toBe(777);
    expect(order.checkout?.contacto.nombre).toBe('privado');
    expect(output).not.toHaveProperty('checkout');
    expect(output).not.toHaveProperty('usuarioId');
    output.items[0].nombre = 'mutado externamente';
    order.checkout!.contacto.nombre = 'otra mutacion';
    expect(order.items[0].nombre).toBe('Prueba');
    expect(output).not.toHaveProperty('checkout');
  });
});

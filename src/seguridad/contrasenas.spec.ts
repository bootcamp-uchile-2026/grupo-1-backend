import { CREDENCIALES_DUMMY } from '../data/credenciales.dummy';
import { ServicioContrasenas } from './contrasenas';

// Parametros bajos solo para que la suite sea rapida; el formato es el mismo.
const rapido = new ServicioContrasenas({ N: 2 ** 10, r: 8, p: 1 });

describe('ServicioContrasenas (scrypt)', () => {
  it('genera hashes con sal distinta que nunca contienen la contrasena', async () => {
    const a = await rapido.hash('Secreta-123');
    const b = await rapido.hash('Secreta-123');
    expect(a).not.toBe(b);
    expect(a).toMatch(
      /^scrypt\$N=1024,r=8,p=1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/,
    );
    expect(a).not.toContain('Secreta-123');
  });

  it('verifica la correcta y rechaza la incorrecta o un hash corrupto', async () => {
    const h = await rapido.hash('Secreta-123');
    await expect(rapido.verificar('Secreta-123', h)).resolves.toBe(true);
    await expect(rapido.verificar('secreta-123', h)).resolves.toBe(false);
    await expect(
      rapido.verificar('Secreta-123', h.slice(0, -2) + 'AA'),
    ).resolves.toBe(false);
    await expect(rapido.verificar('Secreta-123', 'texto-plano')).resolves.toBe(
      false,
    );
    await expect(
      rapido.verificar('x', h.replace('N=1024', 'N=1048576')),
    ).resolves.toBe(false);
  });

  it('normaliza Unicode NFC para que la misma contrasena visible coincida', async () => {
    const h = await rapido.hash('café');
    await expect(rapido.verificar('café', h)).resolves.toBe(true);
  });

  it('verificarSinCuenta siempre responde false', async () => {
    await expect(rapido.verificarSinCuenta('lo-que-sea')).resolves.toBe(false);
  });

  it('los hashes de los fixtures dummy corresponden a las contrasenas demo H2', async () => {
    const produccion = new ServicioContrasenas();
    await expect(
      produccion.verificar(
        'demo-cliente-1',
        CREDENCIALES_DUMMY[0].hashContrasena,
      ),
    ).resolves.toBe(true);
    for (const c of CREDENCIALES_DUMMY) {
      expect(c).not.toHaveProperty('contrasena');
      expect(c.hashContrasena.startsWith('scrypt$N=32768,r=8,p=3$')).toBe(true);
    }
  });

  it('rechaza parametros de costo fuera de rango', () => {
    expect(() => new ServicioContrasenas({ N: 1000, r: 8, p: 1 })).toThrow();
  });
});

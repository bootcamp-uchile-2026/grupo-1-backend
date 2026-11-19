import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { CredencialesRepository } from '../src/repositorios/credenciales.repository';
import { AUDIENCIA_TOKEN, EMISOR_TOKEN } from '../src/seguridad/tokens';
import { bearer } from './utilidades/autenticacion';

interface CuerpoLogin {
  accessToken: string;
  usuario: { id: number };
}
interface CuerpoError {
  message: string;
}

const b64 = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString('base64url');

describe('P2 autenticacion, JWT y propiedad (modo dummy)', () => {
  let app: INestApplication<App>;
  let logs: string[];

  beforeEach(async () => {
    logs = [];
    const capturar = (...args: unknown[]) => {
      logs.push(
        args
          .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
          .join(' '),
      );
    };
    jest.spyOn(Logger.prototype, 'log').mockImplementation(capturar);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(capturar);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(capturar);
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });
  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  const api = () => request(app.getHttpServer());

  it('registro y login validos emiten un JWT que abre solo las rutas del dueno', async () => {
    const cuenta = {
      nombre: 'Ana',
      correoElectronico: 'Ana.P2@Example.org',
      contrasena: 'Clave-P2-segura',
    };
    const registro = await api()
      .post('/auth/registro')
      .send(cuenta)
      .expect(201);
    expect(registro.body).toEqual({
      id: 3,
      nombre: 'Ana',
      correoElectronico: 'ana.p2@example.org',
    });

    const login = await api()
      .post('/auth/login')
      .send({
        correoElectronico: 'ANA.P2@example.org',
        contrasena: 'Clave-P2-segura',
      })
      .expect(200);
    expect(login.body).toMatchObject({
      mensaje: 'Inicio de sesion correcto',
      usuario: {
        id: 3,
        nombre: 'Ana',
        correoElectronico: 'ana.p2@example.org',
      },
      tipoToken: 'Bearer',
      expiraEnSegundos: 3600,
    });
    const token = (login.body as CuerpoLogin).accessToken;
    expect(token.split('.')).toHaveLength(3);

    await api()
      .get('/usuarios/3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await api()
      .get('/usuarios/3/carrito')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // Acceso cruzado: el usuario 1 existe, pero para el 3 es inexistente.
    for (const ruta of [
      '/usuarios/1',
      '/usuarios/1/direcciones',
      '/usuarios/1/carrito',
      '/usuarios/1/pedidos',
      '/usuarios/1/favoritos',
    ]) {
      const r = await api()
        .get(ruta)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect((r.body as CuerpoError).message).toBe(
        'No existe el usuario con id 1',
      );
    }
    await api()
      .patch('/usuarios/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Intruso' })
      .expect(404);
    await api()
      .get('/usuarios/1')
      .set('Authorization', bearer(app, 1))
      .expect(200)
      .expect((r) =>
        expect((r.body as { nombre: string }).nombre).toBe('Fernanda'),
      );
  });

  it('credenciales invalidas responden 401 con mensaje unico', async () => {
    for (const datos of [
      { correoElectronico: 'cliente@stylenow.cl', contrasena: 'incorrecta' },
      { correoElectronico: 'nadie@example.org', contrasena: 'demo-cliente-1' },
    ]) {
      const r = await api().post('/auth/login').send(datos).expect(401);
      expect((r.body as CuerpoError).message).toBe(
        'Correo electronico o contrasena incorrectos',
      );
      expect(r.body).not.toHaveProperty('accessToken');
    }
    const ok = await api()
      .post('/auth/login')
      .send({
        correoElectronico: 'cliente@stylenow.cl',
        contrasena: 'demo-cliente-1',
      })
      .expect(200);
    expect((ok.body as CuerpoLogin).usuario.id).toBe(1);
  });

  it('JWT ausente, manipulado, de otro secreto, alg none o expirado responde 401', async () => {
    const valido = bearer(app, 1).slice(7);
    const [h, c, f] = valido.split('.');
    const cuerpo = JSON.parse(Buffer.from(c, 'base64url').toString()) as Record<
      string,
      number | string
    >;
    const conSecreto = (secreto: string, contenido: object) => {
      const base = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(contenido)}`;
      return `${base}.${createHmac('sha256', secreto).update(base).digest('base64url')}`;
    };
    const ahora = Math.floor(Date.now() / 1000);
    const casos: (string | undefined)[] = [
      undefined,
      'Bearer',
      `Basic ${valido}`,
      `Bearer ${h}.${b64({ ...cuerpo, sub: '2' })}.${f}`,
      `Bearer ${conSecreto('otro-secreto-de-al-menos-32-bytes!!', cuerpo)}`,
      `Bearer ${b64({ alg: 'none', typ: 'JWT' })}.${b64(cuerpo)}.`,
      `Bearer ${conSecreto(process.env.JWT_SECRET as string, { sub: '1', iss: EMISOR_TOKEN, aud: AUDIENCIA_TOKEN, iat: ahora - 7200, exp: ahora - 3600 })}`,
    ];
    for (const autorizacion of casos) {
      const solicitud = api().get('/usuarios/1');
      if (autorizacion !== undefined)
        solicitud.set('Authorization', autorizacion);
      const r = await solicitud.expect(401);
      expect(r.body).toMatchObject({ statusCode: 401 });
      expect(JSON.stringify(r.body)).not.toContain(valido);
    }
    // El token firmado con el secreto real y vigente sigue sirviendo.
    await api()
      .get('/usuarios/1')
      .set('Authorization', `Bearer ${valido}`)
      .expect(200);
  });

  it('rutas publicas siguen sin token; las de usuario y POST /pedidos lo exigen', async () => {
    for (const ruta of [
      '/productos',
      '/productos/1',
      '/categorias',
      '/colecciones',
      '/posts',
      '/looks',
    ]) {
      await api().get(ruta).expect(200);
    }
    await api().post('/auth/logout').expect(200);
    for (const ruta of [
      '/usuarios/1',
      '/usuarios/1/carrito',
      '/usuarios/1/direcciones',
      '/usuarios/1/alertas',
      '/usuarios/1/favoritos',
      '/usuarios/1/pedidos',
    ]) {
      await api().get(ruta).expect(401);
    }
    await api().post('/pedidos').send({}).expect(401);
    // Componer un look es una escritura: exige sesion (autoria pendiente, F11).
    await api().post('/looks').send({}).expect(401);
  });

  it('POST /pedidos usa el dueno del token: un carrito ajeno es inexistente', async () => {
    const carrito1 = (
      await api()
        .get('/usuarios/1/carrito')
        .set('Authorization', bearer(app, 1))
        .expect(200)
    ).body as { id: number };
    const r = await api()
      .post('/pedidos')
      .set('Authorization', bearer(app, 2))
      .send({
        carritoId: carrito1.id,
        contacto: {
          nombre: 'X',
          email: 'x@example.org',
          telefono: '+56911111111',
        },
        direccion: {
          calle: 'Calle',
          numero: '1',
          comuna: 'Comuna',
          region: 'Region',
        },
        metodoPago: 'webpay',
      });
    expect(r.status).toBe(404);
    expect((r.body as CuerpoError).message).toBe(
      `No existe el carrito con id ${carrito1.id}`,
    );
  });

  it('B1: un id positivo no representable responde 404, no 500', async () => {
    for (const varianteId of ['9007199254740993', '1e20']) {
      const r = await api()
        .post('/usuarios/1/carrito/items')
        .set('Authorization', bearer(app, 1))
        .set('Content-Type', 'application/json')
        .send(`{"varianteId":${varianteId},"cantidad":1}`);
      expect(r.status).toBe(404);
    }
  });

  it('cambio de contrasena guarda hash; respuestas y logs nunca exponen contrasenas ni hashes', async () => {
    await api()
      .patch('/usuarios/1/contrasena')
      .set('Authorization', bearer(app, 1))
      .send({
        contrasenaActual: 'demo-cliente-1',
        contrasenaNueva: 'Nueva-P2-clave',
      })
      .expect((r) => expect([200, 204]).toContain(r.status));
    const guardada = await app.get(CredencialesRepository).buscarPorUsuario(1);
    expect(guardada?.hashContrasena).toMatch(/^scrypt\$/);
    expect(guardada?.hashContrasena).not.toContain('Nueva-P2-clave');
    await api()
      .post('/auth/login')
      .send({
        correoElectronico: 'cliente@stylenow.cl',
        contrasena: 'demo-cliente-1',
      })
      .expect(401);
    const login = await api()
      .post('/auth/login')
      .send({
        correoElectronico: 'cliente@stylenow.cl',
        contrasena: 'Nueva-P2-clave',
      })
      .expect(200);
    const perfil = await api()
      .get('/usuarios/1')
      .set('Authorization', `Bearer ${(login.body as CuerpoLogin).accessToken}`)
      .expect(200);
    const todo =
      JSON.stringify([(login.body as CuerpoLogin).usuario, perfil.body]) +
      logs.join('\n');
    for (const secreto of [
      'Nueva-P2-clave',
      'demo-cliente-1',
      'scrypt$',
      'hashContrasena',
      guardada?.hashContrasena ?? '#',
    ]) {
      expect(todo).not.toContain(secreto);
    }
    expect(logs.join('\n')).not.toContain(
      (login.body as CuerpoLogin).accessToken,
    );
  });
});

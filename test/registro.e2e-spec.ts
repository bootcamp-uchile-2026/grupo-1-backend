import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { solicitudAutenticada } from './utilidades/autenticacion';

describe('registro', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = fixture.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => app.close());
  it('crea el perfil público y rechaza repetir el correo', async () => {
    const api = solicitudAutenticada(app);
    const cuenta = {
      nombre: 'Prueba',
      correoElectronico: 'registro@example.org',
      contrasena: 'sintetica-123',
    };
    const res = await api.post('/auth/registro').send(cuenta).expect(201);
    expect(res.body).not.toHaveProperty('contrasena');
    const perfil = res.body as { id: number };
    await api.get('/usuarios/' + perfil.id).expect(200);
    await api.post('/auth/registro').send(cuenta).expect(409);
  });
});

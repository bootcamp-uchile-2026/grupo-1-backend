import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { solicitudAutenticada } from './utilidades/autenticacion';

describe('favoritos', () => {
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
  it('lista solo los productos del usuario y conserva el alta existente', async () => {
    const api = solicitudAutenticada(app);
    await api.get('/usuarios/1/favoritos').expect(200, []);
    await api.post('/usuarios/1/favoritos').send({ productoId: 1 }).expect(201);
    const res = await api.get('/usuarios/1/favoritos').expect(200);
    expect(res.body).toEqual([expect.objectContaining({ id: 1 })]);
    await api.get('/usuarios/2/favoritos').expect(200, []);
    await api.get('/usuarios/99999/favoritos').expect(404);
    await api.post('/usuarios/1/favoritos').send({ productoId: 1 }).expect(409);
  });
});

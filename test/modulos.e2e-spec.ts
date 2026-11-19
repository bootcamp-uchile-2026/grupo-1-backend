import type { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { solicitudAutenticada } from './utilidades/autenticacion';

describe('Modulos de dominio', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('comparte el carrito entre auth, usuarios y carrito', async () => {
    const registro = await solicitudAutenticada(app)
      .post('/auth/registro')
      .send({
        nombre: 'Prueba',
        correoElectronico: 'modules@example.test',
        contrasena: 'Testing-pass-123',
      });
    expect(registro.status).toBe(201);
    const user = registro.body as { id: number };
    await solicitudAutenticada(app)
      .post('/usuarios/' + user.id + '/carrito/items')
      .send({ varianteId: 101, cantidad: 1 })
      .expect(201);
    const carrito = await solicitudAutenticada(app)
      .get('/usuarios/' + user.id + '/carrito')
      .expect(200);
    expect((carrito.body as { items: unknown[] }).items).toHaveLength(1);
  });
});

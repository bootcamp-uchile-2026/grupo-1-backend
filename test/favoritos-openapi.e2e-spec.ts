import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
describe('Contrato integrado de favoritos', () => {
  it('documenta 400 y 404 con el esquema comun', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = module.createNestApplication();
    try {
      const doc = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().build(),
      );
      for (const status of ['400', '404']) {
        expect(
          doc.paths['/usuarios/{usuarioId}/favoritos'].get?.responses[status],
        ).toMatchObject({
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponseDto' },
            },
          },
        });
      }
    } finally {
      await app.close();
    }
  });
});

import { execFileSync } from 'node:child_process';
import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
describe('Integracion variante y restricciones Swagger', () => {
  it('compila sin claves duplicadas y conserva minimum', async () => {
    execFileSync(
      process.execPath,
      [
        require.resolve('typescript/bin/tsc'),
        '--noEmit',
        '--incremental',
        'false',
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = module.createNestApplication();
    try {
      const doc = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().build(),
      );
      expect(doc.components?.schemas?.CrearCambioDevolucionDto).toMatchObject({
        properties: { nuevaVarianteId: { minimum: 1 } },
      });
    } finally {
      await app.close();
    }
  });
});

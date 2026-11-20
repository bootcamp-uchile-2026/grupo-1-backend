import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

describe('Restricciones publicadas en OpenAPI', () => {
  it('publica formato de correo y limites de entradas validas', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = module.createNestApplication();
    try {
      const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().build(),
      );
      const schemas = document.components?.schemas;
      expect(schemas).toMatchObject({
        LoginDto: {
          properties: {
            correoElectronico: { format: 'email', maxLength: 320 },
          },
        },
        AgregarItemCarritoDto: { properties: { cantidad: { minimum: 1 } } },
        RegistrarUsuarioDto: {
          properties: {
            nombre: { minLength: 1 },
            correoElectronico: { format: 'email', maxLength: 320 },
          },
        },
        ProductoDetalleResponseDto: {
          properties: { calificacion: { minimum: 0, maximum: 5 } },
        },
        ActualizarDireccionDto: { properties: { calle: { minLength: 1 } } },
      });
    } finally {
      await app.close();
    }
  });
});

/** Conserva los valores por defecto de la aplicación cuando se omite PORT. */
export function validarEntorno(
  configuracion: Record<string, unknown>,
): Record<string, unknown> {
  const valor = configuracion.PORT;
  const resultado = { ...configuracion };
  if (valor !== undefined && !(typeof valor === 'string' && !valor.trim())) {
    const puerto = typeof valor === 'string' ? valor.trim() : '';
    if (!/^\d+$/.test(puerto) || Number(puerto) < 1 || Number(puerto) > 65535) {
      throw new Error('PORT debe ser un entero entre 1 y 65535.');
    }
    resultado.PORT = puerto;
  }
  const modo = configuracion.PERSISTENCIA ?? 'dummy';
  if (modo !== 'dummy' && modo !== 'mysql') {
    throw new Error('PERSISTENCIA debe ser dummy o mysql.');
  }
  if (modo === 'mysql') {
    const valorDb = configuracion.DB_PORT ?? '3306';
    const puertoDb = typeof valorDb === 'string' ? valorDb.trim() : '';
    if (
      !/^\d+$/.test(puertoDb) ||
      Number(puertoDb) < 1 ||
      Number(puertoDb) > 65535
    ) {
      throw new Error('DB_PORT debe ser un entero entre 1 y 65535.');
    }
    resultado.DB_PORT = puertoDb;
    for (const clave of [
      'DB_HOST',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
    ]) {
      const dato = configuracion[clave];
      if (typeof dato !== 'string' || !dato.trim()) {
        throw new Error(clave + ' es obligatorio para conectar MySQL.');
      }
    }
  }
  return resultado;
}

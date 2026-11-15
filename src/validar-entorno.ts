/** Conserva los valores por defecto de la aplicación cuando se omite PORT. */
export function validarEntorno(
  configuracion: Record<string, unknown>,
): Record<string, unknown> {
  const valor = configuracion.PORT;
  if (valor === undefined || (typeof valor === 'string' && !valor.trim())) {
    return configuracion;
  }

  const puerto = typeof valor === 'string' ? valor.trim() : '';
  if (!/^\d+$/.test(puerto) || Number(puerto) < 1 || Number(puerto) > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }
  return { ...configuracion, PORT: puerto };
}

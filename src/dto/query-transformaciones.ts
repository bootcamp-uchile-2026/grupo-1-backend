/**
 * Un query param booleano llega como texto. Solo 'true' y 'false' se
 * convierten; cualquier otro valor se deja intacto para que IsBoolean lo
 * rechace con 400 en vez de interpretarlo.
 */
export const aBooleano = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

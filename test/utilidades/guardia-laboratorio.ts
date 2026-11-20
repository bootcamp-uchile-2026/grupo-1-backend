/** Solo admite bases aleatorias creadas por los runners locales de pruebas. */
export function laboratorioDesechable(): boolean {
  return (
    process.env.MYSQL_LAB_GUARD === 'exclusive-disposable-pr0' &&
    process.env.DB_HOST === '127.0.0.1' &&
    /^stylenow_pr0_[a-f0-9]{12}_test$/.test(process.env.DB_DATABASE ?? '') &&
    process.env.DB_DATABASE === process.env.MYSQL_LAB_DATABASE
  );
}
export function exigirLaboratorio(): void {
  if (!laboratorioDesechable())
    throw new Error(
      'E2E requiere laboratorio MySQL exclusivo: node test/persistencia/ejecutar-sql01-laboratorio.cjs',
    );
}

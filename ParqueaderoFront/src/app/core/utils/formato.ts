const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/**
 * 1250000 → "$ 1.250.000"
 */
export function formatearDinero(valor: number | null | undefined): string {
  return formatoPesos.format(valor ?? 0);
}

/**
 * "2026-10" → "octubre de 2026"
 */
export function formatearPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number);

  if (!anio || !mes) {
    return periodo;
  }

  return new Date(anio, mes - 1, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });
}

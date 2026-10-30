/**
 * Horas a partir de las cuales un vehículo dentro
 * se marca como "Revisar".
 */
export const HORAS_LIMITE_PERMANENCIA = 24;

function minutosDesde(fecha: string): number {
  const diferencia = Math.max(0, Date.now() - new Date(fecha).getTime());

  return Math.floor(diferencia / 60000);
}

/**
 * "1 día 3 h 20 min" desde la fecha indicada hasta ahora.
 */
export function formatearPermanencia(fechaEntrada: string): string {
  const minutosTotales = minutosDesde(fechaEntrada);

  const dias = Math.floor(minutosTotales / 1440);

  const horas = Math.floor((minutosTotales % 1440) / 60);

  const minutos = minutosTotales % 60;

  const partes: string[] = [];

  if (dias > 0) {
    partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
  }

  if (horas > 0) {
    partes.push(`${horas} h`);
  }

  partes.push(`${minutos} min`);

  return partes.join(' ');
}

export function superaLimitePermanencia(fechaEntrada: string): boolean {
  return minutosDesde(fechaEntrada) > HORAS_LIMITE_PERMANENCIA * 60;
}

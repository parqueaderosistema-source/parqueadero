import { HttpErrorResponse } from '@angular/common/http';

/**
 * Devuelve el mensaje que envía el servidor (error.error.message).
 * Si no viene, usa el mensaje por estado HTTP o el mensaje por defecto.
 */
export function obtenerMensajeError(
  error: unknown,
  porDefecto: string,
  porEstado: Record<number, string> = {},
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return porDefecto;
  }

  if (error.status === 0) {
    return 'No hay conexión con el servidor. Verifica que esté en funcionamiento.';
  }

  const mensaje = error.error?.message;

  if (typeof mensaje === 'string' && mensaje.trim()) {
    return mensaje;
  }

  return porEstado[error.status] ?? porDefecto;
}

/**
 * Convierte error.error.errores ({ campo: string[] })
 * en { campo: primerMensaje }.
 */
export function obtenerErroresDeCampo(error: unknown): Record<string, string> {
  if (!(error instanceof HttpErrorResponse)) {
    return {};
  }

  const errores = error.error?.errores;

  if (!errores || typeof errores !== 'object') {
    return {};
  }

  const resultado: Record<string, string> = {};

  for (const [campo, mensajes] of Object.entries(errores)) {
    if (Array.isArray(mensajes) && mensajes.length > 0) {
      resultado[campo] = String(mensajes[0]);
    } else if (typeof mensajes === 'string' && mensajes) {
      resultado[campo] = mensajes;
    }
  }

  return resultado;
}

export function obtenerEstadoHttp(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}

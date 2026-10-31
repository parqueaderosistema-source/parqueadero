import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';

import { API_URL } from '../config/api.config';

import {
  ArchivoDescargado,
  EliminarMesRequest,
  EliminarMesResponse,
  FiltrosHistorial,
  HistorialResponse,
  MesesHistorialResponse,
  VistaPreviaEliminacionResponse,
} from '../models/admin.model';

/**
 * Lee el nombre de 'attachment; filename="historial-2026-08.xlsx"'
 * (el back lo expone con exposedHeaders de CORS).
 */
function nombreDesdeEncabezado(encabezado: string | null): string | null {
  const coincidencia = encabezado?.match(/filename="?([^";]+)"?/i);

  return coincidencia?.[1] ?? null;
}

/**
 * Con responseType 'blob' el cuerpo del error también llega como Blob.
 * Se convierte a JSON para que obtenerMensajeError lea "message".
 */
function convertirErrorBlob(error: unknown): Observable<never> {
  if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) {
    return throwError(() => error);
  }

  return from(error.error.text()).pipe(
    switchMap((texto) => {
      let cuerpo: unknown = null;

      try {
        cuerpo = JSON.parse(texto);
      } catch {
        cuerpo = null;
      }

      return throwError(
        () =>
          new HttpErrorResponse({
            error: cuerpo,
            headers: error.headers,
            status: error.status,
            statusText: error.statusText,
            url: error.url ?? undefined,
          }),
      );
    }),
  );
}

/**
 * Historial del administrador: consulta, exportación y eliminación mensual.
 */
@Injectable({
  providedIn: 'root',
})
export class HistorialService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${inject(API_URL)}/historial`;

  obtenerMeses(): Observable<MesesHistorialResponse> {
    return this.http.get<MesesHistorialResponse>(`${this.apiUrl}/meses`);
  }

  /**
   * Solo se envían los filtros con valor.
   */
  obtenerHistorial(filtros: FiltrosHistorial): Observable<HistorialResponse> {
    const params: Record<string, string | number> = {};

    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params[clave] = valor;
      }
    }

    return this.http.get<HistorialResponse>(this.apiUrl, { params });
  }

  descargarMes(periodo: string): Observable<ArchivoDescargado> {
    return this.http
      .get(`${this.urlMes(periodo)}/exportar`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((respuesta) => ({
          archivo: respuesta.body ?? new Blob(),
          nombre:
            nombreDesdeEncabezado(respuesta.headers.get('Content-Disposition')) ??
            `historial-${periodo}.xlsx`,
        })),

        catchError(convertirErrorBlob),
      );
  }

  prepararEliminacionMes(
    periodo: string,
  ): Observable<VistaPreviaEliminacionResponse> {
    return this.http.get<VistaPreviaEliminacionResponse>(
      `${this.urlMes(periodo)}/preparar-eliminacion`,
    );
  }

  eliminarMes(
    periodo: string,
    datos: EliminarMesRequest,
  ): Observable<EliminarMesResponse> {
    return this.http.delete<EliminarMesResponse>(this.urlMes(periodo), {
      body: datos,
    });
  }

  private urlMes(periodo: string): string {
    return `${this.apiUrl}/mes/${encodeURIComponent(periodo)}`;
  }
}

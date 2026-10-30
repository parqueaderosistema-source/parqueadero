import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';

import {
  ActualizarTipoVehiculoRequest,
  ArchivoDescargado,
  TipoVehiculoGuardadoResponse,
  TiposVehiculoAdminResponse,
  EliminarMesRequest,
  EliminarMesResponse,
  FormatoExportacion,
  HistorialMesResponse,
  MesesHistorialResponse,
  PrepararEliminacionResponse,
  ResumenAdminResponse,
} from '../models/admin.model';

/**
 * Lee el nombre de 'attachment; filename="historial-2026-08.xlsx"'.
 * El navegador solo expone el encabezado si el back lo incluye
 * en "exposedHeaders" de CORS; si no, se usa el nombre por defecto.
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
 * Endpoints exclusivos del administrador.
 * Lo operativo (entrada, salida, caja) sigue en ParqueaderoService.
 */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  obtenerResumenAdmin(): Observable<ResumenAdminResponse> {
    return this.http.get<ResumenAdminResponse>(
      `${this.apiUrl}/registros/resumen/admin`,
    );
  }

  obtenerMesesHistorial(): Observable<MesesHistorialResponse> {
    return this.http.get<MesesHistorialResponse>(
      `${this.apiUrl}/historial/meses`,
    );
  }

  obtenerHistorialMes(
    periodo: string,
    pagina: number,
    limite: number,
  ): Observable<HistorialMesResponse> {
    return this.http.get<HistorialMesResponse>(
      `${this.apiUrl}/historial/mes/${encodeURIComponent(periodo)}`,
      {
        params: {
          pagina,
          limite,
        },
      },
    );
  }

  descargarHistorialMes(
    periodo: string,
    formato: FormatoExportacion,
  ): Observable<ArchivoDescargado> {
    return this.http
      .get(
        `${this.apiUrl}/historial/mes/${encodeURIComponent(periodo)}/exportar`,
        {
          params: { formato },
          responseType: 'blob',
          observe: 'response',
        },
      )
      .pipe(
        map((respuesta) => ({
          archivo: respuesta.body ?? new Blob(),
          nombre:
            nombreDesdeEncabezado(respuesta.headers.get('Content-Disposition')) ??
            `historial-${periodo}.${formato}`,
        })),

        catchError(convertirErrorBlob),
      );
  }

  prepararEliminacionMes(
    periodo: string,
  ): Observable<PrepararEliminacionResponse> {
    return this.http.get<PrepararEliminacionResponse>(
      `${this.apiUrl}/historial/mes/${encodeURIComponent(periodo)}/preparar-eliminacion`,
    );
  }

  obtenerTiposVehiculo(): Observable<TiposVehiculoAdminResponse> {
    return this.http.get<TiposVehiculoAdminResponse>(
      `${this.apiUrl}/tipos-vehiculo`,
    );
  }

  crearTipoVehiculo(nombre: string): Observable<TipoVehiculoGuardadoResponse> {
    return this.http.post<TipoVehiculoGuardadoResponse>(
      `${this.apiUrl}/tipos-vehiculo`,
      { nombre },
    );
  }

  actualizarTipoVehiculo(
    id: string,
    datos: ActualizarTipoVehiculoRequest,
  ): Observable<TipoVehiculoGuardadoResponse> {
    return this.http.patch<TipoVehiculoGuardadoResponse>(
      `${this.apiUrl}/tipos-vehiculo/${encodeURIComponent(id)}`,
      datos,
    );
  }

  eliminarMes(
    periodo: string,
    datos: EliminarMesRequest,
  ): Observable<EliminarMesResponse> {
    return this.http.delete<EliminarMesResponse>(
      `${this.apiUrl}/historial/mes/${encodeURIComponent(periodo)}`,
      {
        body: datos,
      },
    );
  }
}

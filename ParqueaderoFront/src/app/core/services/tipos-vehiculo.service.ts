import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';

import {
  ActualizarTipoVehiculoRequest,
  TipoVehiculoGuardadoResponse,
  TiposVehiculoAdminResponse,
} from '../models/admin.model';

import { TiposVehiculoResponse } from '../models/parqueadero.model';

/**
 * Tipos de vehículo: los activos (para registrar entradas)
 * y la gestión completa del administrador.
 */
@Injectable({
  providedIn: 'root',
})
export class TiposVehiculoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${inject(API_URL)}/tipos-vehiculo`;

  obtenerActivos(): Observable<TiposVehiculoResponse> {
    return this.http.get<TiposVehiculoResponse>(`${this.apiUrl}/activos`);
  }

  /**
   * Activos e inactivos (solo administrador).
   */
  obtenerTodos(): Observable<TiposVehiculoAdminResponse> {
    return this.http.get<TiposVehiculoAdminResponse>(this.apiUrl);
  }

  crear(nombre: string): Observable<TipoVehiculoGuardadoResponse> {
    return this.http.post<TipoVehiculoGuardadoResponse>(this.apiUrl, {
      nombre,
    });
  }

  actualizar(
    id: string,
    datos: ActualizarTipoVehiculoRequest,
  ): Observable<TipoVehiculoGuardadoResponse> {
    return this.http.patch<TipoVehiculoGuardadoResponse>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      datos,
    );
  }
}

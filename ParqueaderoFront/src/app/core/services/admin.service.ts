import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';

import { ResumenAdminResponse } from '../models/admin.model';

/**
 * Datos del dashboard del administrador.
 * Historial y tipos de vehículo tienen su propio servicio.
 */
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = inject(API_URL);

  obtenerResumenAdmin(): Observable<ResumenAdminResponse> {
    return this.http.get<ResumenAdminResponse>(
      `${this.apiUrl}/registros/resumen/admin`,
    );
  }
}

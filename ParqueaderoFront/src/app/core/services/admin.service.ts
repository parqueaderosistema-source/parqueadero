import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ResumenAdminResponse } from '../models/admin.model';

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
}

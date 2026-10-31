import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api.config';

import {
  BuscarVehiculoResponse,
  RecaudoDiarioResponse,
  RegistrarEntradaRequest,
  RegistrarEntradaResponse,
  RegistrarSalidaRequest,
  RegistrarSalidaResponse,
  VehiculosDentroResponse,
  ResumenDiaResponse,
} from '../models/parqueadero.model';

/**
 * Operación del parqueadero: entradas, salidas, caja y resumen del día.
 */
@Injectable({
  providedIn: 'root',
})
export class ParqueaderoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = inject(API_URL);

  registrarEntrada(
    datos: RegistrarEntradaRequest,
  ): Observable<RegistrarEntradaResponse> {
    return this.http.post<RegistrarEntradaResponse>(
      `${this.apiUrl}/registros/entrada`,
      datos,
    );
  }
  buscarVehiculoPorPlaca(placa: string): Observable<BuscarVehiculoResponse> {
    return this.http.get<BuscarVehiculoResponse>(
      `${this.apiUrl}/registros/buscar/${encodeURIComponent(
        placa.trim().toUpperCase(),
      )}`,
    );
  }

  registrarSalida(
    placa: string,
    datos: RegistrarSalidaRequest,
  ): Observable<RegistrarSalidaResponse> {
    return this.http.patch<RegistrarSalidaResponse>(
      `${this.apiUrl}/registros/salida/${encodeURIComponent(
        placa.trim().toUpperCase(),
      )}`,
      datos,
    );
  }
  obtenerRecaudoHoy(): Observable<RecaudoDiarioResponse> {
    return this.http.get<RecaudoDiarioResponse>(
      `${this.apiUrl}/registros/recaudo/hoy`,
    );
  }
  obtenerVehiculosDentro(): Observable<VehiculosDentroResponse> {
    return this.http.get<VehiculosDentroResponse>(
      `${this.apiUrl}/registros/dentro`,
    );
  }
  obtenerResumenHoy(): Observable<ResumenDiaResponse> {
    return this.http.get<ResumenDiaResponse>(
      `${this.apiUrl}/registros/resumen/hoy`,
    );
  }
}

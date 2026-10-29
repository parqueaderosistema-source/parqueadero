import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  BuscarVehiculoResponse,
  RecaudoDiarioResponse,
  RegistrarEntradaRequest,
  RegistrarEntradaResponse,
  RegistrarSalidaRequest,
  RegistrarSalidaResponse,
  TiposVehiculoResponse,
  VehiculosDentroResponse,
  ResumenDiaResponse,
} from '../models/parqueadero.model';

@Injectable({
  providedIn: 'root',
})
export class ParqueaderoService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  obtenerTiposVehiculo(): Observable<TiposVehiculoResponse> {
    return this.http.get<TiposVehiculoResponse>(
      `${this.apiUrl}/tipos-vehiculo/activos`,
    );
  }

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

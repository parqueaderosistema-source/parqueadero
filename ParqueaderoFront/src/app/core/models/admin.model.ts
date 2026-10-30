import { RegistroParqueadero, ResumenDiaResponse } from './parqueadero.model';

/**
 * GET /api/registros/resumen/admin
 */
export type TipoMovimiento = 'entrada' | 'salida' | 'anulacion';

export interface MovimientoReciente extends RegistroParqueadero {
  tipoVehiculoPersonalizado: string | null;
  tipoMostrado: string;
  movimiento: TipoMovimiento;
  fechaMovimiento: string;
}

export interface ResumenAdminResponse extends ResumenDiaResponse {
  mes: string;
  recaudoMes: number;
  anuladosHoy: number;
  ultimosMovimientos: MovimientoReciente[];
}

/**
 * GET /api/historial/meses
 * Solo meses con vehículos retirados.
 */
export interface MesHistorial {
  periodo: string;
  nombreMes: string;
  cantidadRegistros: number;
  totalRecaudado: number;
}

export interface MesesHistorialResponse {
  ok: boolean;
  meses: MesHistorial[];
}

/**
 * GET /api/historial/mes/:periodo?pagina=&limite=
 * Registros retirados del mes, ordenados por salida descendente.
 */
export interface RegistroHistorial extends RegistroParqueadero {
  tipoVehiculoPersonalizado?: string | null;
}

export interface HistorialMesResponse {
  ok: boolean;
  periodo: string;
  pagina: number;
  limite: number;
  totalRegistros: number;
  totalPaginas: number;
  totalRecaudado: number;
  registros: RegistroHistorial[];
}

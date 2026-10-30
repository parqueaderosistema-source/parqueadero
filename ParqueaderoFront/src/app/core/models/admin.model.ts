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

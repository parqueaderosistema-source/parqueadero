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

/**
 * GET /api/historial/mes/:periodo/preparar-eliminacion
 * 400 si es el mes actual o un mes futuro.
 */
export interface PrepararEliminacionResponse {
  ok: boolean;
  periodo: string;
  nombrePeriodo: string;
  cantidadRegistros: number;
  totalRecaudado: number;

  /**
   * Texto exacto que se debe escribir, p. ej. "ELIMINAR OCTUBRE 2026".
   */
  confirmacionRequerida: string;
}

/**
 * DELETE /api/historial/mes/:periodo
 */
export interface EliminarMesRequest {
  confirmacion: string;
  respaldoDescargado: boolean;
}

export interface EliminarMesResponse {
  ok: boolean;
  message: string;
  resultado: {
    periodo: string;
    cantidadEliminada: number;
    totalRecaudado: number;
    respaldoDescargado: boolean;
  };
}

/**
 * GET /api/historial/mes/:periodo/exportar?formato=xlsx|csv
 */
export type FormatoExportacion = 'xlsx' | 'csv';

export interface ArchivoDescargado {
  archivo: Blob;
  nombre: string;
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

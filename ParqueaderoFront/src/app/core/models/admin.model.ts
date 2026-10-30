import {
  RegistroParqueadero,
  ResumenDiaResponse,
  TipoVehiculo,
} from './parqueadero.model';

/**
 * GET /api/tipos-vehiculo (todos, activos e inactivos)
 * permitePersonalizado no se puede cambiar desde la API.
 */
export interface TipoVehiculoAdmin extends TipoVehiculo {
  permitePersonalizado: boolean;
}

export interface TiposVehiculoAdminResponse {
  ok: boolean;
  tipos: TipoVehiculoAdmin[];
}

/**
 * POST /api/tipos-vehiculo y PATCH /api/tipos-vehiculo/:id
 */
export interface TipoVehiculoGuardadoResponse {
  ok: boolean;
  message: string;
  tipo: TipoVehiculoAdmin;
}

export interface ActualizarTipoVehiculoRequest {
  nombre?: string;
  activo?: boolean;
}

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
 * Meses con registros (por fecha de entrada), del más reciente al más antiguo.
 */
export interface MesHistorial {
  periodo: string;
  nombreMes: string;
  cantidadRegistros: number;
  dentro: number;
  retirados: number;
  anulados: number;
  totalRecaudado: number;
}

export interface MesesHistorialResponse {
  ok: boolean;
  meses: MesHistorial[];
}

/**
 * GET /api/historial?mes=|desde=&hasta=&placa=&tipoVehiculoId=&estado=&page=&limit=
 * "mes" y el rango desde/hasta son excluyentes. Fechas AAAA-MM-DD.
 */
export type EstadoRegistro = RegistroParqueadero['estado'];

export interface FiltrosHistorial {
  mes?: string;
  desde?: string;
  hasta?: string;
  placa?: string;
  tipoVehiculoId?: string;
  estado?: EstadoRegistro;
  page: number;
  limit: number;
}

export interface UsuarioReferencia {
  _id: string;
  nombre: string;
}

export interface RegistroHistorial extends RegistroParqueadero {
  tipoVehiculoPersonalizado?: string | null;
  tipoMostrado: string;
  registradoEntradaPor?: UsuarioReferencia | null;
  registradoSalidaPor?: UsuarioReferencia | null;
  anuladoPor?: UsuarioReferencia | null;
  fechaAnulacion?: string | null;
  motivoAnulacion?: string | null;
}

export interface ResumenHistorial {
  registros: number;
  retirados: number;
  anulados: number;
  recaudo: number;
}

export interface HistorialResponse {
  ok: boolean;
  items: RegistroHistorial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  resumen: ResumenHistorial;
}

/**
 * GET /api/historial/mes/:periodo/preparar-eliminacion (no borra nada)
 */
export interface VistaPreviaEliminacionResponse {
  ok: boolean;
  periodo: string;
  nombrePeriodo: string;
  cantidadAEliminar: number;
  retirados: number;
  anulados: number;
  recaudo: number;

  /**
   * Vehículos aún dentro: nunca se eliminan.
   */
  dentroConservados: number;

  eliminable: boolean;
  motivoNoEliminable: string | null;

  /**
   * Texto exacto que se debe escribir: "ELIMINAR 2026-08".
   */
  confirmacionRequerida: string;
}

/**
 * DELETE /api/historial/mes/:periodo
 * En "descargar-y-eliminar" el back exige una descarga del mismo
 * periodo en los últimos 60 minutos (la verifica en la auditoría).
 */
export type ModoEliminacion = 'descargar-y-eliminar' | 'sin-descargar';

export interface EliminarMesRequest {
  confirmacion: string;
  modo: ModoEliminacion;
  descargado: boolean;
}

export interface EliminarMesResponse {
  ok: boolean;
  message: string;
  resultado: {
    periodo: string;
    modo: ModoEliminacion;
    cantidadEliminada: number;
    totalRecaudado: number;
    dentroConservados: number;
    fechaEliminacion: string;
  };
}

/**
 * GET /api/historial/mes/:periodo/exportar (solo Excel)
 */
export interface ArchivoDescargado {
  archivo: Blob;
  nombre: string;
}

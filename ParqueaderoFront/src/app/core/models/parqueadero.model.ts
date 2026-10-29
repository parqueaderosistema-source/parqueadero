export interface TipoVehiculo {
  _id: string;
  nombre: string;
  activo: boolean;
}

export interface TiposVehiculoResponse {
  ok: boolean;
  tipos: TipoVehiculo[];
}

export interface RegistrarEntradaRequest {
  placa: string;
  tipoVehiculoId: string;
  tipoVehiculoPersonalizado?: string;
  tiempoEstimado: string;
  observacion: string;
}

export interface RegistroParqueadero {
  _id: string;
  placa: string;
  tipoVehiculoNombre: string;
  fechaHoraEntrada: string;
  tiempoEstimado: string;
  fechaHoraSalida: string | null;
  valorCobrado: number | null;
  estado: 'dentro' | 'retirado' | 'anulado';
  observacion: string;
}

export interface RegistrarEntradaResponse {
  ok: boolean;
  message: string;
  registro: RegistroParqueadero;
}

export interface TiempoTranscurrido {
  dias: number;
  horas: number;
  minutos: number;
  minutosTotales: number;
}

export interface RegistroConTiempo extends RegistroParqueadero {
  tiempoTranscurrido: TiempoTranscurrido;
}

export interface BuscarVehiculoResponse {
  ok: boolean;
  registro: RegistroConTiempo;
}

export interface RegistrarSalidaRequest {
  valorCobrado: number;
  observacion?: string;
}

export interface RegistrarSalidaResponse {
  ok: boolean;
  message: string;
  registro: RegistroParqueadero;
}

export interface RecaudoDiarioResponse {
  ok: boolean;
  fecha: string;
  totalVehiculos: number;
  totalRecaudado: number;
  registros: RegistroParqueadero[];
}

export interface VehiculosDentroResponse {
  ok: boolean;
  total: number;
  registros: RegistroParqueadero[];
}
export interface ResumenDiaResponse {
  ok: boolean;
  fecha: string;
  vehiculosDentro: number;
  entradasHoy: number;
  salidasHoy: number;
  recaudoHoy: number;
}

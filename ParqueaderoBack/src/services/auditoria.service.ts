import { AuditoriaModel } from "../models/Auditoria.js";

/**
 * Acciones que quedan registradas en la auditoría.
 */
export type AccionAuditoria =
  | "ENTRADA_VEHICULO"
  | "SALIDA_VEHICULO"
  | "HISTORIAL_DESCARGADO"
  | "HISTORIAL_MENSUAL_ELIMINADO"
  | "TIPO_VEHICULO_CREADO"
  | "TIPO_VEHICULO_ACTUALIZADO";

export async function registrarAuditoria(evento: {
  usuarioId: string;
  accion: AccionAuditoria;
  descripcion: string;
  datos?: Record<string, unknown>;
}): Promise<void> {
  await AuditoriaModel.create({
    usuario: evento.usuarioId,
    accion: evento.accion,
    descripcion: evento.descripcion,
    datos: evento.datos ?? {},
  });
}

/**
 * Indica si el usuario descargó el Excel del periodo
 * dentro de los últimos minutos indicados.
 */
export async function existeDescargaReciente(
  usuarioId: string,
  periodo: string,
  minutos: number,
): Promise<boolean> {
  const descarga = await AuditoriaModel.exists({
    accion: "HISTORIAL_DESCARGADO" satisfies AccionAuditoria,
    usuario: usuarioId,
    "datos.periodo": periodo,
    createdAt: { $gte: new Date(Date.now() - minutos * 60 * 1000) },
  });

  return descarga !== null;
}

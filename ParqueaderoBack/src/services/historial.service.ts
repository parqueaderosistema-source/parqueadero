import { Types } from "mongoose";

import { RegistroParqueaderoModel } from "../models/RegistroParqueadero.js";
import {
  obtenerRangoDias,
  obtenerRangoMes,
  obtenerZonaHoraria,
} from "../utils/fechas.js";
import { HttpError } from "../utils/httpError.js";
import { conTipoMostrado } from "../utils/tipoMostrado.js";
import type { FiltrosHistorial } from "../validators/historial.validator.js";
import {
  existeDescargaReciente,
  registrarAuditoria,
} from "./auditoria.service.js";
import { construirExcelHistorial } from "./historialExcel.service.js";

/**
 * Historial con filtros y paginación.
 * Un registro pertenece al día/mes de su fecha de entrada.
 */
export async function obtenerHistorial(filtros: FiltrosHistorial) {
  const filtro: Record<string, unknown> = {};

  let rango: { inicioUtc?: Date; finUtc?: Date };

  try {
    rango = filtros.mes
      ? obtenerRangoMes(filtros.mes)
      : obtenerRangoDias(filtros.desde, filtros.hasta);
  } catch (error) {
    throw new HttpError(
      400,
      error instanceof Error ? error.message : "Rango de fechas no válido",
    );
  }

  if (rango.inicioUtc || rango.finUtc) {
    filtro.fechaHoraEntrada = {
      ...(rango.inicioUtc ? { $gte: rango.inicioUtc } : {}),
      ...(rango.finUtc ? { $lte: rango.finUtc } : {}),
    };
  }

  // La placa ya viene normalizada (solo A-Z y 0-9): es seguro usarla en la regex.
  if (filtros.placa) {
    filtro.placa = { $regex: filtros.placa };
  }

  if (filtros.tipoVehiculoId) {
    filtro.tipoVehiculo = new Types.ObjectId(filtros.tipoVehiculoId);
  }

  if (filtros.estado) {
    filtro.estado = filtros.estado;
  }

  const { page, limit } = filtros;

  const [items, conteo] = await Promise.all([
    RegistroParqueaderoModel.find(filtro)
      .sort({ fechaHoraEntrada: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("registradoEntradaPor", "nombre")
      .populate("registradoSalidaPor", "nombre")
      .populate("anuladoPor", "nombre")
      .lean(),

    contarPorEstado(filtro),
  ]);

  const resumen = {
    registros: conteo.cantidad,
    retirados: conteo.retirados,
    anulados: conteo.anulados,
    recaudo: conteo.recaudo,
  };

  return {
    items: items.map(conTipoMostrado),
    total: resumen.registros,
    page,
    limit,
    totalPages: Math.ceil(resumen.registros / limit),
    resumen,
  };
}

/*
 * Historial mensual: resumen por mes, exportación y eliminación.
 * Un registro pertenece al mes de su fecha de entrada (Bogotá).
 */

/**
 * Rango UTC de un mes, respondiendo 400 si el periodo no es válido.
 */
function rangoDelPeriodo(periodo: string) {
  try {
    return obtenerRangoMes(periodo);
  } catch (error) {
    throw new HttpError(
      400,
      error instanceof Error ? error.message : "El periodo no es válido",
    );
  }
}

function filtroEntradasDelPeriodo(periodo: string) {
  const { inicioUtc, finUtc } = rangoDelPeriodo(periodo);

  return {
    fechaHoraEntrada: { $gte: inicioUtc, $lte: finUtc },
  };
}

/**
 * Lo que se borra al eliminar un mes: retirados y anulados.
 * Los vehículos "dentro" nunca se eliminan.
 */
function filtroEliminablesDelPeriodo(periodo: string) {
  return {
    ...filtroEntradasDelPeriodo(periodo),
    estado: { $in: ["retirado", "anulado"] as ("retirado" | "anulado")[] },
  };
}

/**
 * Ejemplo: 2026-08 → "agosto 2026"
 */
export function obtenerNombrePeriodo(periodo: string): string {
  return rangoDelPeriodo(periodo)
    .inicioLocal.setLocale("es")
    .toFormat("LLLL yyyy");
}

/**
 * Ejemplo: 2026-09 → "ELIMINAR 2026-09"
 */
export function obtenerConfirmacionEliminacion(periodo: string): string {
  rangoDelPeriodo(periodo);

  return `ELIMINAR ${periodo}`;
}

/**
 * Motivo por el que no se puede eliminar un mes, o null si se puede.
 */
function motivoNoEliminable(periodo: string): string | null {
  const { inicioLocal } = rangoDelPeriodo(periodo);

  const mesActual = obtenerRangoMes().inicioLocal;

  if (inicioLocal.hasSame(mesActual, "month")) {
    return "No se puede eliminar el historial del mes en curso";
  }

  if (inicioLocal > mesActual) {
    return "No se puede eliminar un periodo futuro";
  }

  return null;
}

/**
 * Conteos por estado y recaudo (solo retirados) de un filtro.
 */
async function contarPorEstado(filtro: Record<string, unknown>) {
  const resultado = await RegistroParqueaderoModel.aggregate<{
    cantidad: number;
    retirados: number;
    anulados: number;
    recaudo: number;
  }>([
    { $match: filtro },
    {
      $group: {
        _id: null,
        cantidad: { $sum: 1 },
        retirados: {
          $sum: { $cond: [{ $eq: ["$estado", "retirado"] }, 1, 0] },
        },
        anulados: {
          $sum: { $cond: [{ $eq: ["$estado", "anulado"] }, 1, 0] },
        },
        recaudo: {
          $sum: {
            $cond: [
              { $eq: ["$estado", "retirado"] },
              { $ifNull: ["$valorCobrado", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    cantidad: resultado[0]?.cantidad ?? 0,
    retirados: resultado[0]?.retirados ?? 0,
    anulados: resultado[0]?.anulados ?? 0,
    recaudo: resultado[0]?.recaudo ?? 0,
  };
}

/**
 * Resumen de todos los meses que tienen registros.
 */
export async function obtenerResumenMensual() {
  const meses = await RegistroParqueaderoModel.aggregate<{
    _id: string;
    cantidadRegistros: number;
    dentro: number;
    retirados: number;
    anulados: number;
    totalRecaudado: number;
  }>([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$fechaHoraEntrada",
            timezone: obtenerZonaHoraria(),
          },
        },
        cantidadRegistros: { $sum: 1 },
        dentro: { $sum: { $cond: [{ $eq: ["$estado", "dentro"] }, 1, 0] } },
        retirados: {
          $sum: { $cond: [{ $eq: ["$estado", "retirado"] }, 1, 0] },
        },
        anulados: {
          $sum: { $cond: [{ $eq: ["$estado", "anulado"] }, 1, 0] },
        },
        totalRecaudado: {
          $sum: {
            $cond: [
              { $eq: ["$estado", "retirado"] },
              { $ifNull: ["$valorCobrado", 0] },
              0,
            ],
          },
        },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return meses.map(({ _id, ...datos }) => ({
    periodo: _id,
    nombreMes: obtenerNombrePeriodo(_id),
    ...datos,
  }));
}

/**
 * Vista previa de la eliminación: no borra nada.
 */
export async function obtenerVistaPreviaEliminacion(periodo: string) {
  const [eliminables, dentroConservados] = await Promise.all([
    contarPorEstado(filtroEliminablesDelPeriodo(periodo)),

    RegistroParqueaderoModel.countDocuments({
      ...filtroEntradasDelPeriodo(periodo),
      estado: "dentro",
    }),
  ]);

  const motivo =
    motivoNoEliminable(periodo) ??
    (eliminables.cantidad === 0
      ? "No hay registros para eliminar en este periodo"
      : null);

  return {
    periodo,
    nombrePeriodo: obtenerNombrePeriodo(periodo),
    cantidadAEliminar: eliminables.cantidad,
    retirados: eliminables.retirados,
    anulados: eliminables.anulados,
    recaudo: eliminables.recaudo,
    dentroConservados,
    eliminable: motivo === null,
    motivoNoEliminable: motivo,
    confirmacionRequerida: obtenerConfirmacionEliminacion(periodo),
  };
}

/**
 * Genera el Excel del mes y registra la descarga en la auditoría.
 */
export async function generarExcelHistorial(
  periodo: string,
  usuarioId: string,
): Promise<{ archivo: Buffer; nombreArchivo: string }> {
  const registros = await RegistroParqueaderoModel.find(
    filtroEntradasDelPeriodo(periodo),
  )
    .sort({ fechaHoraEntrada: 1 })
    .populate<{ registradoEntradaPor: { nombre: string } | null }>(
      "registradoEntradaPor",
      "nombre",
    )
    .populate<{ registradoSalidaPor: { nombre: string } | null }>(
      "registradoSalidaPor",
      "nombre",
    )
    .lean();

  if (registros.length === 0) {
    throw new HttpError(404, "No hay registros en ese periodo");
  }

  const { archivo, totalRecaudado } = await construirExcelHistorial(
    registros,
    obtenerZonaHoraria(),
  );

  await registrarAuditoria({
    usuarioId,
    accion: "HISTORIAL_DESCARGADO",
    descripcion: `Descarga del historial de ${obtenerNombrePeriodo(periodo)}`,
    datos: {
      periodo,
      cantidadRegistros: registros.length,
      totalRecaudado,
    },
  });

  return { archivo, nombreArchivo: `historial-${periodo}.xlsx` };
}

export type ModoEliminacion = "descargar-y-eliminar" | "sin-descargar";

/**
 * Minutos que pueden pasar entre la descarga y la eliminación
 * en el modo "descargar-y-eliminar".
 */
const MINUTOS_VALIDEZ_DESCARGA = 60;

/**
 * Elimina definitivamente los retirados y anulados de un mes cerrado.
 */
export async function eliminarHistorialMes(datos: {
  periodo: string;
  confirmacion: string;
  modo: ModoEliminacion;
  descargado: boolean;
  usuarioId: string;
}) {
  const { periodo, modo, usuarioId } = datos;

  const confirmacionRequerida = obtenerConfirmacionEliminacion(periodo);

  if (datos.confirmacion !== confirmacionRequerida) {
    throw new HttpError(
      400,
      `La confirmación no es correcta. Escriba exactamente: ${confirmacionRequerida}`,
    );
  }

  const motivo = motivoNoEliminable(periodo);

  if (motivo) {
    throw new HttpError(409, motivo);
  }

  if (modo === "descargar-y-eliminar") {
    if (!datos.descargado) {
      throw new HttpError(
        400,
        "En el modo descargar-y-eliminar debe descargar el Excel antes de eliminar",
      );
    }

    // Se comprueba en la auditoría que la descarga realmente ocurrió.
    const descargaReciente = await existeDescargaReciente(
      usuarioId,
      periodo,
      MINUTOS_VALIDEZ_DESCARGA,
    );

    if (!descargaReciente) {
      throw new HttpError(
        409,
        `No hay una descarga de ${periodo} en los últimos ${MINUTOS_VALIDEZ_DESCARGA} minutos. Descargue el Excel nuevamente`,
      );
    }
  }

  const vistaPrevia = await obtenerVistaPreviaEliminacion(periodo);

  if (vistaPrevia.cantidadAEliminar === 0) {
    throw new HttpError(404, "No hay registros para eliminar en este periodo");
  }

  const resultado = await RegistroParqueaderoModel.deleteMany(
    filtroEliminablesDelPeriodo(periodo),
  );

  const fechaEliminacion = new Date();

  await registrarAuditoria({
    usuarioId,
    accion: "HISTORIAL_MENSUAL_ELIMINADO",
    descripcion: `Se eliminó el historial de ${vistaPrevia.nombrePeriodo}`,
    datos: {
      periodo,
      modo,
      cantidadEliminada: resultado.deletedCount,
      retirados: vistaPrevia.retirados,
      anulados: vistaPrevia.anulados,
      totalRecaudado: vistaPrevia.recaudo,
      dentroConservados: vistaPrevia.dentroConservados,
      fechaEliminacion,
    },
  });

  return {
    periodo,
    modo,
    cantidadEliminada: resultado.deletedCount,
    totalRecaudado: vistaPrevia.recaudo,
    dentroConservados: vistaPrevia.dentroConservados,
    fechaEliminacion,
  };
}

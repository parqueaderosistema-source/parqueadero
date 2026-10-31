import { RegistroParqueaderoModel } from "../models/RegistroParqueadero.js";
import {
  obtenerRangoDiaActual,
  obtenerRangoMes,
  type RangoFechas,
} from "../utils/fechas.js";
import { conTipoMostrado } from "../utils/tipoMostrado.js";

/*
 * Consultas de solo lectura: caja diaria y resúmenes.
 * Las operaciones que modifican registros están en registro.service.
 */

/**
 * Filtro de salidas cobradas dentro de un rango.
 * Es la única definición de "recaudo": la usan la caja,
 * el resumen del día y el dashboard del administrador.
 * Los anulados no cuentan porque su estado no es "retirado".
 */
function crearFiltroSalidas(rango: RangoFechas) {
  return {
    estado: "retirado" as const,
    fechaHoraSalida: {
      $gte: rango.inicioUtc,
      $lte: rango.finUtc,
    },
  };
}

async function calcularRecaudo(rango: RangoFechas): Promise<number> {
  const resultado = await RegistroParqueaderoModel.aggregate<{
    total: number;
  }>([
    { $match: crearFiltroSalidas(rango) },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$valorCobrado", 0] } },
      },
    },
  ]);

  return resultado[0]?.total ?? 0;
}

export async function obtenerRecaudoDelDia() {
  const rango = obtenerRangoDiaActual();

  const [registros, totalRecaudado] = await Promise.all([
    RegistroParqueaderoModel.find(crearFiltroSalidas(rango))
      .sort({
        fechaHoraSalida: -1,
      })
      .lean(),

    calcularRecaudo(rango),
  ]);

  return {
    fecha: rango.inicioLocal.toISODate(),
    totalVehiculos: registros.length,
    totalRecaudado,
    registros: registros.map(conTipoMostrado),
  };
}

export async function obtenerResumenDelDia() {
  const rango = obtenerRangoDiaActual();

  const [vehiculosDentro, entradasHoy, salidasHoy, recaudoHoy] =
    await Promise.all([
      RegistroParqueaderoModel.countDocuments({
        estado: "dentro",
      }),

      RegistroParqueaderoModel.countDocuments({
        estado: { $ne: "anulado" },
        fechaHoraEntrada: {
          $gte: rango.inicioUtc,
          $lte: rango.finUtc,
        },
      }),

      RegistroParqueaderoModel.countDocuments(crearFiltroSalidas(rango)),

      calcularRecaudo(rango),
    ]);

  return {
    fecha: rango.inicioLocal.toISODate(),

    vehiculosDentro,

    entradasHoy,

    salidasHoy,

    recaudoHoy,
  };
}

const CANTIDAD_ULTIMOS_MOVIMIENTOS = 5;

/**
 * Resumen del día más los datos exclusivos del administrador.
 */
export async function obtenerResumenAdministrador() {
  const rangoDia = obtenerRangoDiaActual();
  const rangoMes = obtenerRangoMes();

  const [resumenDia, recaudoMes, anuladosHoy, ultimos] = await Promise.all([
    obtenerResumenDelDia(),

    calcularRecaudo(rangoMes),

    RegistroParqueaderoModel.countDocuments({
      estado: "anulado",
      fechaAnulacion: {
        $gte: rangoDia.inicioUtc,
        $lte: rangoDia.finUtc,
      },
    }),

    RegistroParqueaderoModel.find()
      .sort({ updatedAt: -1 })
      .limit(CANTIDAD_ULTIMOS_MOVIMIENTOS)
      .lean(),
  ]);

  const ultimosMovimientos = ultimos.map((registro) => {
    const movimiento =
      registro.estado === "dentro"
        ? "entrada"
        : registro.estado === "retirado"
          ? "salida"
          : "anulacion";

    const fecha =
      movimiento === "entrada"
        ? registro.fechaHoraEntrada
        : movimiento === "salida"
          ? registro.fechaHoraSalida
          : registro.updatedAt;

    return {
      ...conTipoMostrado(registro),
      movimiento,
      fechaMovimiento: fecha,
    };
  });

  return {
    ...resumenDia,
    mes: rangoMes.inicioLocal.toFormat("yyyy-MM"),
    recaudoMes,
    anuladosHoy,
    ultimosMovimientos,
  };
}

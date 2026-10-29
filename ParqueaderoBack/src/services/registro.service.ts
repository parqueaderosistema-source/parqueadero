import { Types } from "mongoose";

import { AuditoriaModel } from "../models/Auditoria.js";
import { RegistroParqueaderoModel } from "../models/RegistroParqueadero.js";
import { TipoVehiculoModel } from "../models/TipoVehiculo.js";
import { DateTime } from "luxon";
import { HttpError } from "../utils/httpError.js";
import { normalizarPlaca } from "../validators/registro.validator.js";

/**
 * Código de MongoDB para violación de índice único.
 */
function esErrorDuplicado(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

interface EntradaDatos {
  placa: string;
  tipoVehiculoId: string;
  tiempoEstimado: string;
  observacion: string;
  usuarioId: string;
}

export async function registrarEntradaVehiculo(datos: EntradaDatos) {
  const placaNormalizada = normalizarPlaca(datos.placa);

  const mensajeYaDentro = `El vehículo con placa ${placaNormalizada} ya se encuentra dentro del parqueadero`;

  if (!Types.ObjectId.isValid(datos.tipoVehiculoId)) {
    throw new HttpError(400, "El tipo de vehículo no es válido");
  }

  const tipoVehiculo = await TipoVehiculoModel.findOne({
    _id: datos.tipoVehiculoId,
    activo: true,
  });

  if (!tipoVehiculo) {
    throw new HttpError(400, "El tipo de vehículo no existe o está desactivado");
  }

  const vehiculoDentro = await RegistroParqueaderoModel.findOne({
    placa: placaNormalizada,
    estado: "dentro",
  }).lean();

  if (vehiculoDentro) {
    throw new HttpError(409, mensajeYaDentro);
  }

  /*
   * Si dos entradas de la misma placa llegan al mismo tiempo,
   * el índice único parcial (placa + estado "dentro") rechaza la segunda.
   */
  const registro = await RegistroParqueaderoModel.create({
    placa: placaNormalizada,
    tipoVehiculo: tipoVehiculo._id,
    tipoVehiculoNombre: tipoVehiculo.nombre,
    fechaHoraEntrada: new Date(),
    tiempoEstimado: datos.tiempoEstimado,
    fechaHoraSalida: null,
    valorCobrado: null,
    estado: "dentro",
    observacion: datos.observacion,
    registradoEntradaPor: datos.usuarioId,
    registradoSalidaPor: null,
  }).catch((error: unknown) => {
    if (esErrorDuplicado(error)) {
      throw new HttpError(409, mensajeYaDentro);
    }

    throw error;
  });

  await AuditoriaModel.create({
    usuario: datos.usuarioId,
    accion: "ENTRADA_VEHICULO",
    descripcion: `Entrada registrada para la placa ${placaNormalizada}`,
    datos: {
      registroId: registro._id,
      placa: placaNormalizada,
      tipoVehiculo: tipoVehiculo.nombre,
    },
  });

  return registro;
}

export async function obtenerVehiculosDentro() {
  return RegistroParqueaderoModel.find({
    estado: "dentro",
  })
    .sort({
      fechaHoraEntrada: -1,
    })
    .lean();
}
interface SalidaDatos {
  placa: string;
  valorCobrado: number;
  observacion?: string;
  usuarioId: string;
}

export async function buscarVehiculoDentroPorPlaca(placa: string) {
  const placaNormalizada = normalizarPlaca(placa);

  const registro = await RegistroParqueaderoModel.findOne({
    placa: placaNormalizada,
    estado: "dentro",
  }).lean();

  if (!registro) {
    throw new HttpError(
      404,
      `No se encontró un vehículo dentro del parqueadero con la placa ${placaNormalizada}`,
    );
  }

  const ahora = new Date();

  const milisegundos =
    ahora.getTime() - new Date(registro.fechaHoraEntrada).getTime();

  const minutosTotales = Math.max(0, Math.floor(milisegundos / 60000));

  const dias = Math.floor(minutosTotales / 1440);

  const horas = Math.floor((minutosTotales % 1440) / 60);

  const minutos = minutosTotales % 60;

  return {
    ...registro,
    tiempoTranscurrido: {
      dias,
      horas,
      minutos,
      minutosTotales,
    },
  };
}

export async function registrarSalidaVehiculo(datos: SalidaDatos) {
  const placaNormalizada = normalizarPlaca(datos.placa);

  const fechaHoraSalida = new Date();

  /*
   * La actualización es atómica:
   * solamente puede salir si todavía está "dentro".
   */
  const registro = await RegistroParqueaderoModel.findOneAndUpdate(
    {
      placa: placaNormalizada,
      estado: "dentro",
    },
    {
      $set: {
        estado: "retirado",
        fechaHoraSalida,
        valorCobrado: datos.valorCobrado,
        registradoSalidaPor: datos.usuarioId,
        ...(datos.observacion !== undefined
          ? { observacion: datos.observacion }
          : {}),
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!registro) {
    /*
     * No se actualizó nada: averiguamos por qué
     * para responder con el código correcto.
     */
    const ultimoRegistro = await RegistroParqueaderoModel.findOne({
      placa: placaNormalizada,
    })
      .sort({ fechaHoraEntrada: -1 })
      .select("estado")
      .lean();

    if (!ultimoRegistro) {
      throw new HttpError(
        404,
        `No existe ningún registro para la placa ${placaNormalizada}`,
      );
    }

    throw new HttpError(
      409,
      ultimoRegistro.estado === "retirado"
        ? `El vehículo con placa ${placaNormalizada} ya fue retirado; no se puede registrar otra salida ni otro cobro`
        : `El último registro de la placa ${placaNormalizada} está anulado; no se puede registrar la salida`,
    );
  }

  await AuditoriaModel.create({
    usuario: datos.usuarioId,
    accion: "SALIDA_VEHICULO",
    descripcion: `Salida registrada para la placa ${placaNormalizada}`,
    datos: {
      registroId: registro._id,
      placa: placaNormalizada,
      valorCobrado: datos.valorCobrado,
      fechaHoraSalida,
    },
  });

  return registro;
}
export async function obtenerRecaudoDelDia() {
  const timezone = process.env.APP_TIMEZONE ?? "America/Bogota";

  const ahora = DateTime.now().setZone(timezone);

  const inicioDia = ahora.startOf("day").toUTC().toJSDate();

  const finDia = ahora.endOf("day").toUTC().toJSDate();

  const registros = await RegistroParqueaderoModel.find({
    estado: "retirado",

    fechaHoraSalida: {
      $gte: inicioDia,
      $lte: finDia,
    },
  })
    .sort({
      fechaHoraSalida: -1,
    })
    .lean();

  const totalRecaudado = registros.reduce(
    (total, registro) => total + (registro.valorCobrado ?? 0),
    0,
  );

  return {
    fecha: ahora.toISODate(),
    totalVehiculos: registros.length,
    totalRecaudado,
    registros,
  };
}
export async function obtenerResumenDelDia() {
  const timezone = process.env.APP_TIMEZONE ?? "America/Bogota";

  const ahora = DateTime.now().setZone(timezone);

  const inicioDia = ahora.startOf("day").toUTC().toJSDate();

  const finDia = ahora.endOf("day").toUTC().toJSDate();

  const [vehiculosDentro, entradasHoy, salidasHoy, recaudo] = await Promise.all(
    [
      RegistroParqueaderoModel.countDocuments({
        estado: "dentro",
      }),

      RegistroParqueaderoModel.countDocuments({
        fechaHoraEntrada: {
          $gte: inicioDia,
          $lte: finDia,
        },
      }),

      RegistroParqueaderoModel.countDocuments({
        estado: "retirado",

        fechaHoraSalida: {
          $gte: inicioDia,
          $lte: finDia,
        },
      }),

      RegistroParqueaderoModel.aggregate([
        {
          $match: {
            estado: "retirado",

            fechaHoraSalida: {
              $gte: inicioDia,
              $lte: finDia,
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: {
                $ifNull: ["$valorCobrado", 0],
              },
            },
          },
        },
      ]),
    ],
  );

  return {
    fecha: ahora.toISODate(),

    vehiculosDentro,

    entradasHoy,

    salidasHoy,

    recaudoHoy: recaudo[0]?.total ?? 0,
  };
}

import { DateTime } from "luxon";
import ExcelJS from "exceljs";

import { AuditoriaModel } from "../models/Auditoria.js";
import { RegistroParqueaderoModel } from "../models/RegistroParqueadero.js";

/**
 * Zona horaria utilizada por el parqueadero.
 */
function obtenerZonaHoraria(): string {
  return process.env.APP_TIMEZONE ?? "America/Bogota";
}

/**
 * Obtiene el inicio y fin de un mes.
 *
 * Ejemplo:
 * 2026-08
 */
function obtenerRangoPeriodo(periodo: string) {
  const timezone = obtenerZonaHoraria();

  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    throw new Error("El periodo debe tener el formato AAAA-MM");
  }

  const inicioLocal = DateTime.fromFormat(periodo, "yyyy-MM", {
    zone: timezone,
  }).startOf("month");

  if (!inicioLocal.isValid) {
    throw new Error("El periodo no es válido");
  }

  const finLocal = inicioLocal.endOf("month");

  return {
    inicioLocal,

    inicioUtc: inicioLocal.toUTC().toJSDate(),

    finUtc: finLocal.toUTC().toJSDate(),
  };
}

/**
 * Crea el filtro que utilizaremos para buscar
 * registros retirados dentro de un mes.
 */
function crearFiltroPeriodo(periodo: string) {
  const { inicioUtc, finUtc } = obtenerRangoPeriodo(periodo);

  return {
    estado: "retirado" as const,

    fechaHoraSalida: {
      $gte: inicioUtc,
      $lte: finUtc,
    },
  };
}

/**
 * Obtiene el resumen de todos los meses
 * que tienen vehículos retirados.
 */
export async function obtenerResumenMensual() {
  const timezone = obtenerZonaHoraria();

  const registros = await RegistroParqueaderoModel.find({
    estado: "retirado",

    fechaHoraSalida: {
      $ne: null,
    },
  })
    .select("fechaHoraSalida valorCobrado")
    .sort({
      fechaHoraSalida: -1,
    })
    .lean();

  const meses = new Map<
    string,
    {
      periodo: string;
      nombreMes: string;
      cantidadRegistros: number;
      totalRecaudado: number;
    }
  >();

  for (const registro of registros) {
    if (!registro.fechaHoraSalida) {
      continue;
    }

    const fecha = DateTime.fromJSDate(
      new Date(registro.fechaHoraSalida),
    ).setZone(timezone);

    const periodo = fecha.toFormat("yyyy-MM");

    const existente = meses.get(periodo);

    if (existente) {
      existente.cantidadRegistros += 1;

      existente.totalRecaudado += registro.valorCobrado ?? 0;
    } else {
      meses.set(periodo, {
        periodo,

        nombreMes: fecha.setLocale("es").toFormat("LLLL yyyy"),

        cantidadRegistros: 1,

        totalRecaudado: registro.valorCobrado ?? 0,
      });
    }
  }

  return Array.from(meses.values());
}

/**
 * Obtiene el historial de un mes.
 * Utiliza paginación para no cargar miles
 * de registros de una sola vez.
 */
export async function obtenerHistorialDeMes(
  periodo: string,
  pagina = 1,
  limite = 25,
) {
  const filtro = crearFiltroPeriodo(periodo);

  const saltar = (pagina - 1) * limite;

  const [registros, total] = await Promise.all([
    RegistroParqueaderoModel.find(filtro)
      .sort({
        fechaHoraSalida: -1,
      })
      .skip(saltar)
      .limit(limite)
      .lean(),

    RegistroParqueaderoModel.countDocuments(filtro),
  ]);

  const totalRecaudado = await RegistroParqueaderoModel.aggregate([
    {
      $match: filtro,
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
  ]);

  return {
    periodo,

    pagina,

    limite,

    totalRegistros: total,

    totalPaginas: total === 0 ? 0 : Math.ceil(total / limite),

    totalRecaudado: totalRecaudado[0]?.total ?? 0,

    registros,
  };
}

/**
 * Devuelve el nombre del mes.
 *
 * Ejemplo:
 * agosto 2026
 */
export function obtenerNombrePeriodo(periodo: string): string {
  const { inicioLocal } = obtenerRangoPeriodo(periodo);

  return inicioLocal.setLocale("es").toFormat("LLLL yyyy");
}

/**
 * Genera el texto de confirmación.
 *
 * Ejemplo:
 * ELIMINAR AGOSTO 2026
 */
export function obtenerConfirmacionEliminacion(periodo: string): string {
  return `ELIMINAR ${obtenerNombrePeriodo(periodo).toUpperCase()}`;
}

/**
 * Verifica si un mes puede ser eliminado.
 */
export function validarMesEliminable(periodo: string): void {
  const timezone = obtenerZonaHoraria();

  const { inicioLocal } = obtenerRangoPeriodo(periodo);

  const mesActual = DateTime.now().setZone(timezone).startOf("month");

  /**
   * No permitimos borrar el mes actual.
   */
  if (
    inicioLocal.year === mesActual.year &&
    inicioLocal.month === mesActual.month
  ) {
    throw new Error("No se puede eliminar el historial del mes actual");
  }

  /**
   * Tampoco permitimos eliminar
   * meses futuros.
   */
  if (inicioLocal > mesActual) {
    throw new Error("No se puede eliminar un periodo futuro");
  }
}

/**
 * Obtiene todos los registros del mes
 * para descargarlos.
 */
export async function obtenerRegistrosParaExportar(periodo: string) {
  const filtro = crearFiltroPeriodo(periodo);

  return RegistroParqueaderoModel.find(filtro)
    .sort({
      fechaHoraSalida: 1,
    })
    .lean();
}

/**
 * Genera un Excel con el historial mensual.
 */
export async function generarExcelHistorial(periodo: string): Promise<Buffer> {
  const timezone = obtenerZonaHoraria();

  const registros = await obtenerRegistrosParaExportar(periodo);

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Sistema de Parqueadero";

  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Historial");

  hoja.columns = [
    {
      header: "Placa",
      key: "placa",
      width: 16,
    },

    {
      header: "Tipo de vehículo",
      key: "tipo",
      width: 25,
    },

    {
      header: "Fecha de entrada",
      key: "fechaEntrada",
      width: 20,
    },

    {
      header: "Hora de entrada",
      key: "horaEntrada",
      width: 18,
    },

    {
      header: "Fecha de salida",
      key: "fechaSalida",
      width: 20,
    },

    {
      header: "Hora de salida",
      key: "horaSalida",
      width: 18,
    },

    {
      header: "Tiempo estimado",
      key: "tiempoEstimado",
      width: 22,
    },

    {
      header: "Valor cobrado",
      key: "valorCobrado",
      width: 18,
    },

    {
      header: "Observación",
      key: "observacion",
      width: 35,
    },
  ];

  for (const registro of registros) {
    const entrada = DateTime.fromJSDate(
      new Date(registro.fechaHoraEntrada),
    ).setZone(timezone);

    const salida = registro.fechaHoraSalida
      ? DateTime.fromJSDate(new Date(registro.fechaHoraSalida)).setZone(
          timezone,
        )
      : null;

    hoja.addRow({
      placa: registro.placa,

      tipo: registro.tipoVehiculoNombre,

      fechaEntrada: entrada.toFormat("dd/MM/yyyy"),

      horaEntrada: entrada.toFormat("hh:mm a"),

      fechaSalida: salida?.toFormat("dd/MM/yyyy") ?? "",

      horaSalida: salida?.toFormat("hh:mm a") ?? "",

      tiempoEstimado: registro.tiempoEstimado,

      valorCobrado: registro.valorCobrado ?? 0,

      observacion: registro.observacion ?? "",
    });
  }

  /**
   * Encabezados en negrita.
   */
  hoja.getRow(1).font = {
    bold: true,
  };

  /**
   * Formato de dinero.
   */
  hoja.getColumn("valorCobrado").numFmt = "$#,##0";

  /**
   * Mantiene visible la primera fila.
   */
  hoja.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}

/**
 * Prepara correctamente los textos
 * que se escribirán en CSV.
 */
function escaparCSV(valor: unknown): string {
  const texto = String(valor ?? "");

  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Genera un archivo CSV.
 */
export async function generarCSVHistorial(periodo: string): Promise<Buffer> {
  const timezone = obtenerZonaHoraria();

  const registros = await obtenerRegistrosParaExportar(periodo);

  const encabezados = [
    "Placa",
    "Tipo de vehículo",
    "Fecha de entrada",
    "Hora de entrada",
    "Fecha de salida",
    "Hora de salida",
    "Tiempo estimado",
    "Valor cobrado",
    "Observación",
  ];

  const filas: string[] = [encabezados.map(escaparCSV).join(",")];

  for (const registro of registros) {
    const entrada = DateTime.fromJSDate(
      new Date(registro.fechaHoraEntrada),
    ).setZone(timezone);

    const salida = registro.fechaHoraSalida
      ? DateTime.fromJSDate(new Date(registro.fechaHoraSalida)).setZone(
          timezone,
        )
      : null;

    filas.push(
      [
        registro.placa,

        registro.tipoVehiculoNombre,

        entrada.toFormat("dd/MM/yyyy"),

        entrada.toFormat("hh:mm a"),

        salida?.toFormat("dd/MM/yyyy") ?? "",

        salida?.toFormat("hh:mm a") ?? "",

        registro.tiempoEstimado,

        registro.valorCobrado ?? 0,

        registro.observacion ?? "",
      ]
        .map(escaparCSV)
        .join(","),
    );
  }

  /**
   * \uFEFF permite que Excel
   * reconozca correctamente tildes,
   * ñ y caracteres especiales.
   */
  return Buffer.from("\uFEFF" + filas.join("\n"), "utf8");
}

/**
 * Elimina definitivamente el historial
 * de un mes cerrado.
 */
export async function eliminarHistorialMes(
  periodo: string,
  usuarioId: string,
  respaldoDescargado: boolean,
) {
  validarMesEliminable(periodo);

  const filtro = crearFiltroPeriodo(periodo);

  /**
   * Primero obtenemos información
   * para poder guardar la auditoría.
   */
  const registros = await RegistroParqueaderoModel.find(filtro)
    .select("valorCobrado")
    .lean();

  if (registros.length === 0) {
    throw new Error("No existen registros para eliminar en ese periodo");
  }

  const totalRecaudado = registros.reduce(
    (total, registro) => total + (registro.valorCobrado ?? 0),

    0,
  );

  const cantidadAntes = registros.length;

  /**
   * Eliminación real en MongoDB.
   */
  const resultado = await RegistroParqueaderoModel.deleteMany(filtro);

  /**
   * Aunque los vehículos sean eliminados,
   * conservamos una auditoría pequeña.
   */
  await AuditoriaModel.create({
    usuario: usuarioId,

    accion: "HISTORIAL_MENSUAL_ELIMINADO",

    descripcion: `Se eliminó el historial de ${obtenerNombrePeriodo(periodo)}`,

    datos: {
      periodo,

      cantidadRegistros: resultado.deletedCount,

      cantidadAntes,

      totalRecaudado,

      respaldoDescargado,
    },
  });

  return {
    periodo,

    cantidadEliminada: resultado.deletedCount,

    totalRecaudado,

    respaldoDescargado,
  };
}

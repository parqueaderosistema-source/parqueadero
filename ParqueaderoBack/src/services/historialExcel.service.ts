import ExcelJS from "exceljs";
import { DateTime } from "luxon";

import { conTipoMostrado } from "../utils/tipoMostrado.js";

/**
 * Datos de un registro que necesita el Excel.
 */
export interface FilaHistorialExcel {
  placa: string;
  tipoVehiculoNombre: string;
  tipoVehiculoPersonalizado?: string | null;
  fechaHoraEntrada: Date;
  fechaHoraSalida?: Date | null;
  tiempoEstimado?: string | null;
  valorCobrado?: number | null;
  estado: "dentro" | "retirado" | "anulado";
  observacion?: string | null;
  registradoEntradaPor?: { nombre: string } | null;
  registradoSalidaPor?: { nombre: string } | null;
}

const ESTADOS_EXCEL: Record<FilaHistorialExcel["estado"], string> = {
  dentro: "Dentro",
  retirado: "Retirado",
  anulado: "Anulado",
};

/**
 * Construye el Excel del historial. Solo da formato: no consulta
 * la base de datos ni registra auditoría.
 */
export async function construirExcelHistorial(
  registros: FilaHistorialExcel[],
  timezone: string,
): Promise<{ archivo: Buffer; totalRecaudado: number }> {
  const formatear = (fecha: Date | null | undefined) =>
    fecha
      ? DateTime.fromJSDate(new Date(fecha))
          .setZone(timezone)
          .toFormat("dd/MM/yyyy hh:mm a")
      : "";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Parqueadero";
  workbook.created = new Date();

  const hoja = workbook.addWorksheet("Historial");

  hoja.columns = [
    { header: "Placa", key: "placa", width: 12 },
    { header: "Tipo de vehículo", key: "tipo", width: 24 },
    { header: "Entrada", key: "entrada", width: 20 },
    { header: "Salida", key: "salida", width: 20 },
    { header: "Tiempo indicado", key: "tiempoEstimado", width: 18 },
    { header: "Valor cobrado", key: "valorCobrado", width: 15 },
    { header: "Estado", key: "estado", width: 11 },
    { header: "Observación", key: "observacion", width: 35 },
    { header: "Registró entrada", key: "registroEntrada", width: 20 },
    { header: "Registró salida", key: "registroSalida", width: 20 },
  ];

  let totalRecaudado = 0;
  let retirados = 0;

  for (const registro of registros) {
    if (registro.estado === "retirado") {
      totalRecaudado += registro.valorCobrado ?? 0;
      retirados += 1;
    }

    hoja.addRow({
      placa: registro.placa,
      tipo: conTipoMostrado(registro).tipoMostrado,
      entrada: formatear(registro.fechaHoraEntrada),
      salida: formatear(registro.fechaHoraSalida),
      tiempoEstimado: registro.tiempoEstimado ?? "",
      valorCobrado: registro.valorCobrado ?? null,
      estado: ESTADOS_EXCEL[registro.estado] ?? registro.estado,
      observacion: registro.observacion ?? "",
      registroEntrada: registro.registradoEntradaPor?.nombre ?? "",
      registroSalida: registro.registradoSalidaPor?.nombre ?? "",
    });
  }

  // Fila de totales: solo suman los retirados (los anulados no cuentan).
  const filaTotales = hoja.addRow({
    placa: "TOTAL",
    tipo: `${registros.length} registros · ${retirados} retirados`,
    valorCobrado: totalRecaudado,
  });
  filaTotales.font = { bold: true };

  hoja.getRow(1).font = { bold: true };
  hoja.getColumn("valorCobrado").numFmt = "$#,##0";
  hoja.views = [{ state: "frozen", ySplit: 1 }];

  const archivo = Buffer.from(await workbook.xlsx.writeBuffer());

  return { archivo, totalRecaudado };
}

import type { Request, Response } from "express";

import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  eliminarHistorialMes,
  generarCSVHistorial,
  generarExcelHistorial,
  obtenerConfirmacionEliminacion,
  obtenerHistorialDeMes,
  obtenerNombrePeriodo,
  obtenerResumenMensual,
  validarMesEliminable,
} from "../services/historial.service.js";

export async function listarMeses(
  _request: Request,
  response: Response,
): Promise<void> {
  const meses = await obtenerResumenMensual();

  response.status(200).json({
    ok: true,
    meses,
  });
}

export async function verHistorialMes(
  request: Request<{
    periodo: string;
  }>,
  response: Response,
): Promise<void> {
  try {
    const pagina = Math.max(1, Number(request.query.pagina ?? 1));

    const limiteSolicitado = Number(request.query.limite ?? 25);

    const limite = Math.min(100, Math.max(1, limiteSolicitado));

    const historial = await obtenerHistorialDeMes(
      request.params.periodo,
      pagina,
      limite,
    );

    response.status(200).json({
      ok: true,
      ...historial,
    });
  } catch (error) {
    response.status(400).json({
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible consultar el historial",
    });
  }
}
export async function exportarHistorialMes(
  request: Request<{
    periodo: string;
  }>,
  response: Response,
): Promise<void> {
  try {
    const periodo = request.params.periodo;

    const formato = String(request.query.formato ?? "xlsx").toLowerCase();

    if (formato !== "xlsx" && formato !== "csv") {
      response.status(400).json({
        ok: false,
        message: "El formato debe ser xlsx o csv",
      });

      return;
    }

    if (formato === "xlsx") {
      const archivo = await generarExcelHistorial(periodo);

      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      response.setHeader(
        "Content-Disposition",
        `attachment; filename="historial-${periodo}.xlsx"`,
      );

      response.send(archivo);

      return;
    }

    const archivo = await generarCSVHistorial(periodo);

    response.setHeader("Content-Type", "text/csv; charset=utf-8");

    response.setHeader(
      "Content-Disposition",
      `attachment; filename="historial-${periodo}.csv"`,
    );

    response.send(archivo);
  } catch (error) {
    response.status(400).json({
      ok: false,

      message:
        error instanceof Error
          ? error.message
          : "No fue posible generar el archivo",
    });
  }
}

export async function prepararEliminacionMes(
  request: Request<{
    periodo: string;
  }>,
  response: Response,
): Promise<void> {
  try {
    const periodo = request.params.periodo;

    validarMesEliminable(periodo);

    const historial = await obtenerHistorialDeMes(periodo, 1, 1);

    response.status(200).json({
      ok: true,

      periodo,

      nombrePeriodo: obtenerNombrePeriodo(periodo),

      cantidadRegistros: historial.totalRegistros,

      totalRecaudado: historial.totalRecaudado,

      confirmacionRequerida: obtenerConfirmacionEliminacion(periodo),
    });
  } catch (error) {
    response.status(400).json({
      ok: false,

      message:
        error instanceof Error
          ? error.message
          : "No es posible eliminar este periodo",
    });
  }
}

export async function eliminarMes(
  request: AuthRequest & {
    params: {
      periodo: string;
    };
  },
  response: Response,
): Promise<void> {
  if (!request.usuario) {
    response.status(401).json({
      ok: false,
      message: "No hay una sesión activa",
    });

    return;
  }

  try {
    const periodo = request.params.periodo;

    const confirmacion = String(request.body.confirmacion ?? "").trim();

    const confirmacionCorrecta = obtenerConfirmacionEliminacion(periodo);

    if (confirmacion !== confirmacionCorrecta) {
      response.status(400).json({
        ok: false,

        message: "La confirmación escrita no es correcta",

        confirmacionRequerida: confirmacionCorrecta,
      });

      return;
    }

    const respaldoDescargado = request.body.respaldoDescargado === true;

    const resultado = await eliminarHistorialMes(
      periodo,
      request.usuario.id,
      respaldoDescargado,
    );

    response.status(200).json({
      ok: true,

      message: "Historial eliminado definitivamente",

      resultado,
    });
  } catch (error) {
    response.status(400).json({
      ok: false,

      message:
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el historial",
    });
  }
}

import type { Request, Response } from "express";

import type { AuthRequest } from "../middlewares/auth.middleware.js";

import {
  eliminarHistorialMes,
  generarExcelHistorial,
  obtenerHistorial,
  obtenerResumenMensual,
  obtenerVistaPreviaEliminacion,
} from "../services/historial.service.js";

import { responderError } from "../utils/responderError.js";
import {
  eliminarMesSchema,
  filtrosHistorialSchema,
  periodoSchema,
} from "../validators/historial.validator.js";

/**
 * Valida el parámetro :periodo. Responde 400 y devuelve null si no es válido.
 */
function leerPeriodo(request: Request, response: Response): string | null {
  const resultado = periodoSchema.safeParse(request.params.periodo);

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: resultado.error.issues[0]?.message ?? "El periodo no es válido",
    });
    return null;
  }

  return resultado.data;
}

export async function listarMeses(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const meses = await obtenerResumenMensual();

    response.status(200).json({
      ok: true,
      meses,
    });
  } catch (error) {
    responderError(response, error, "No fue posible consultar los meses");
  }
}

export async function listarHistorial(
  request: Request,
  response: Response,
): Promise<void> {
  const resultado = filtrosHistorialSchema.safeParse(request.query);

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: "Los filtros enviados no son válidos",
      errores: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const historial = await obtenerHistorial(resultado.data);

    response.status(200).json({
      ok: true,
      ...historial,
    });
  } catch (error) {
    responderError(response, error, "No fue posible consultar el historial");
  }
}

export async function exportarHistorialMes(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const periodo = leerPeriodo(request, response);

  if (!periodo || !request.usuario) {
    return;
  }

  try {
    const { archivo, nombreArchivo } = await generarExcelHistorial(
      periodo,
      request.usuario.id,
    );

    response.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`,
    );

    response.send(archivo);
  } catch (error) {
    responderError(response, error, "No fue posible generar el archivo");
  }
}

export async function prepararEliminacionMes(
  request: Request,
  response: Response,
): Promise<void> {
  const periodo = leerPeriodo(request, response);

  if (!periodo) {
    return;
  }

  try {
    const vistaPrevia = await obtenerVistaPreviaEliminacion(periodo);

    response.status(200).json({
      ok: true,
      ...vistaPrevia,
    });
  } catch (error) {
    responderError(
      response,
      error,
      "No fue posible preparar la eliminación del periodo",
    );
  }
}

export async function eliminarMes(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const periodo = leerPeriodo(request, response);

  if (!periodo || !request.usuario) {
    return;
  }

  const resultado = eliminarMesSchema.safeParse(request.body ?? {});

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: "Los datos enviados no son válidos",
      errores: resultado.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const eliminado = await eliminarHistorialMes({
      periodo,
      ...resultado.data,
      usuarioId: request.usuario.id,
    });

    response.status(200).json({
      ok: true,
      message: "Historial eliminado definitivamente",
      resultado: eliminado,
    });
  } catch (error) {
    responderError(response, error, "No fue posible eliminar el historial");
  }
}

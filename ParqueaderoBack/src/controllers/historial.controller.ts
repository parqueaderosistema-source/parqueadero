import type { Request, Response } from "express";

import {
  usuarioDeSesion,
  type AuthRequest,
} from "../middlewares/auth.middleware.js";

import {
  eliminarHistorialMes,
  generarExcelHistorial,
  obtenerHistorial,
  obtenerResumenMensual,
  obtenerVistaPreviaEliminacion,
} from "../services/historial.service.js";

import { validar } from "../utils/validar.js";

import {
  eliminarMesSchema,
  filtrosHistorialSchema,
  periodoParamsSchema,
} from "../validators/historial.validator.js";

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

export async function listarHistorial(
  request: Request,
  response: Response,
): Promise<void> {
  const filtros = validar(
    filtrosHistorialSchema,
    request.query,
    "Los filtros enviados no son válidos",
  );

  const historial = await obtenerHistorial(filtros);

  response.status(200).json({
    ok: true,
    ...historial,
  });
}

export async function exportarHistorialMes(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const { periodo } = validar(periodoParamsSchema, request.params);

  const { archivo, nombreArchivo } = await generarExcelHistorial(
    periodo,
    usuarioDeSesion(request).id,
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
}

export async function prepararEliminacionMes(
  request: Request,
  response: Response,
): Promise<void> {
  const { periodo } = validar(periodoParamsSchema, request.params);

  const vistaPrevia = await obtenerVistaPreviaEliminacion(periodo);

  response.status(200).json({
    ok: true,
    ...vistaPrevia,
  });
}

export async function eliminarMes(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const { periodo } = validar(periodoParamsSchema, request.params);

  const datos = validar(eliminarMesSchema, request.body);

  const eliminado = await eliminarHistorialMes({
    periodo,
    ...datos,
    usuarioId: usuarioDeSesion(request).id,
  });

  response.status(200).json({
    ok: true,
    message: "Historial eliminado definitivamente",
    resultado: eliminado,
  });
}

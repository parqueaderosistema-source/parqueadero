import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { HttpError } from "../utils/httpError.js";

/**
 * Errores que lanza express.json() (body-parser).
 */
function esErrorDelCuerpo(
  error: unknown,
): error is { type: string; status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { type?: unknown }).type === "string"
  );
}

/**
 * Traduce cualquier error a una respuesta JSON.
 * Solo los HttpError exponen su mensaje; el resto responde
 * un mensaje genérico para no filtrar detalles internos.
 * Express 5 envía aquí también los errores de los controladores async.
 */
export function manejarErrores(
  error: unknown,
  _request: Request,
  response: Response,
  // Express identifica el manejador de errores por sus 4 parámetros.
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      ok: false,
      message: error.message,
      ...(error.errores ? { errores: error.errores } : {}),
    });
    return;
  }

  if (esErrorDelCuerpo(error)) {
    const demasiadoGrande = error.type === "entity.too.large";

    response.status(demasiadoGrande ? 413 : 400).json({
      ok: false,
      message: demasiadoGrande
        ? "Los datos enviados son demasiado grandes"
        : "El cuerpo de la petición no es un JSON válido",
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({
      ok: false,
      message: "El identificador enviado no es válido",
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    ok: false,
    message: "Ocurrió un error inesperado. Intente nuevamente.",
  });
}

export function rutaNoEncontrada(_request: Request, response: Response): void {
  response.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
  });
}

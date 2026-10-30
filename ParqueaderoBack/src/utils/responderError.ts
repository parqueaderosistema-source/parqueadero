import type { Response } from "express";

import { HttpError } from "./httpError.js";

/**
 * Responde un error de negocio con su código,
 * o un 500 genérico si es un error inesperado.
 */
export function responderError(
  response: Response,
  error: unknown,
  mensajePorDefecto: string,
): void {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      ok: false,
      message: error.message,
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    ok: false,
    message: mensajePorDefecto,
  });
}

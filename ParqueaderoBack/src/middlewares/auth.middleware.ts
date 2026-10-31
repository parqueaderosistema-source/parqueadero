import type { NextFunction, Request, Response } from "express";

import {
  obtenerUsuarioActivoPorId,
  type UsuarioSesion,
} from "../services/auth.service.js";
import {
  COOKIE_SESION,
  verificarTokenSesion,
} from "../services/token.service.js";
import { HttpError } from "../utils/httpError.js";

export interface AuthRequest extends Request {
  usuario?: UsuarioSesion;
}

/**
 * Exige una sesión válida y carga el usuario desde la base de datos.
 * Así, desactivar un usuario o cambiar su rol tiene efecto inmediato
 * aunque su token todavía no haya expirado.
 */
export async function verificarAutenticacion(
  request: AuthRequest,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  const token: unknown = request.cookies?.[COOKIE_SESION];

  if (typeof token !== "string" || !token) {
    throw new HttpError(401, "No hay una sesión activa");
  }

  const usuarioId = verificarTokenSesion(token);

  const usuario = usuarioId ? await obtenerUsuarioActivoPorId(usuarioId) : null;

  if (!usuario) {
    throw new HttpError(401, "La sesión no es válida o ha expirado");
  }

  request.usuario = usuario;

  next();
}

/**
 * Usuario de la sesión. Solo se usa después de verificarAutenticacion.
 */
export function usuarioDeSesion(request: AuthRequest): UsuarioSesion {
  if (!request.usuario) {
    throw new HttpError(401, "No hay una sesión activa");
  }

  return request.usuario;
}

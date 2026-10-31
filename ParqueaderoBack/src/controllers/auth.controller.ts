import type { Request, Response } from "express";

import {
  usuarioDeSesion,
  type AuthRequest,
} from "../middlewares/auth.middleware.js";
import { autenticarUsuario } from "../services/auth.service.js";
import {
  COOKIE_SESION,
  firmarTokenSesion,
  opcionesBorrarCookieSesion,
  opcionesCookieSesion,
} from "../services/token.service.js";
import { HttpError } from "../utils/httpError.js";
import { validar } from "../utils/validar.js";
import { loginSchema } from "../validators/auth.validator.js";

export async function login(
  request: Request,
  response: Response,
): Promise<void> {
  const { correo, password } = validar(loginSchema, request.body);

  const usuario = await autenticarUsuario(correo, password);

  if (!usuario) {
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }

  response.cookie(
    COOKIE_SESION,
    firmarTokenSesion(usuario.id),
    opcionesCookieSesion,
  );

  response.status(200).json({
    ok: true,
    message: "Inicio de sesión correcto",
    usuario,
  });
}

export function logout(_request: Request, response: Response): void {
  response.clearCookie(COOKIE_SESION, opcionesBorrarCookieSesion);

  response.status(200).json({
    ok: true,
    message: "Sesión cerrada correctamente",
  });
}

/**
 * verificarAutenticacion ya cargó el usuario activo desde la base de datos.
 */
export function me(request: AuthRequest, response: Response): void {
  response.status(200).json({
    ok: true,
    usuario: usuarioDeSesion(request),
  });
}

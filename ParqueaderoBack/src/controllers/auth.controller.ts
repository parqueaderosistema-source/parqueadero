import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { AuthRequest } from "../middlewares/auth.middleware.js";
import {
  autenticarUsuario,
  obtenerUsuarioActivoPorId,
} from "../services/auth.service.js";
import { loginSchema } from "../validators/auth.validator.js";

const COOKIE_NAME = "parqueadero_session";

export async function login(
  request: Request,
  response: Response,
): Promise<void> {
  const resultado = loginSchema.safeParse(request.body);

  if (!resultado.success) {
    response.status(400).json({
      ok: false,
      message: "Los datos enviados no son válidos",
    });
    return;
  }

  const { correo, password } = resultado.data;

  const usuario = await autenticarUsuario(correo, password);

  if (!usuario) {
    response.status(401).json({
      ok: false,
      message: "Correo o contraseña incorrectos",
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET no está configurado");
  }

  const token = jwt.sign(
    {
      sub: usuario.id,
      rol: usuario.rol,
    },
    jwtSecret,
    {
      expiresIn: "8h",
    },
  );

  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });

  response.status(200).json({
    ok: true,
    message: "Inicio de sesión correcto",
    usuario,
  });
}

export function logout(_request: Request, response: Response): void {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  response.status(200).json({
    ok: true,
    message: "Sesión cerrada correctamente",
  });
}

export async function me(
  request: AuthRequest,
  response: Response,
): Promise<void> {
  const usuario = request.usuario
    ? await obtenerUsuarioActivoPorId(request.usuario.id)
    : null;

  if (!usuario) {
    response.status(401).json({
      ok: false,
      message: "La sesión no es válida o el usuario está desactivado",
    });
    return;
  }

  response.status(200).json({
    ok: true,
    usuario,
  });
}

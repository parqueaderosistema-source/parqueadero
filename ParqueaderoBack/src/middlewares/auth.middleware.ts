import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  usuario?: {
    id: string;
    rol: "administrador" | "trabajador";
  };
}

interface TokenPayload {
  sub: string;
  rol: "administrador" | "trabajador";
}

export function verificarAutenticacion(
  request: AuthRequest,
  response: Response,
  next: NextFunction,
): void {
  const token = request.cookies?.parqueadero_session;

  if (!token) {
    response.status(401).json({
      ok: false,
      message: "No hay una sesión activa",
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET no está configurado");
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as TokenPayload;

    request.usuario = {
      id: payload.sub,
      rol: payload.rol,
    };

    next();
  } catch {
    response.status(401).json({
      ok: false,
      message: "La sesión no es válida o ha expirado",
    });
  }
}

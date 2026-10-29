import type { NextFunction, Response } from "express";

import type { AuthRequest } from "./auth.middleware.js";

type Rol = "administrador" | "trabajador";

export function permitirRoles(...rolesPermitidos: Rol[]) {
  return (
    request: AuthRequest,
    response: Response,
    next: NextFunction,
  ): void => {
    const usuario = request.usuario;

    if (!usuario) {
      response.status(401).json({
        ok: false,
        message: "No hay una sesión activa",
      });
      return;
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      response.status(403).json({
        ok: false,
        message: "No tiene permisos para realizar esta acción",
      });
      return;
    }

    next();
  };
}

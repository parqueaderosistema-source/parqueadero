import type { NextFunction, Response } from "express";

import type { Rol } from "../config/roles.js";
import { HttpError } from "../utils/httpError.js";
import { usuarioDeSesion, type AuthRequest } from "./auth.middleware.js";

export function permitirRoles(...rolesPermitidos: Rol[]) {
  return (request: AuthRequest, _response: Response, next: NextFunction) => {
    const usuario = usuarioDeSesion(request);

    if (!rolesPermitidos.includes(usuario.rol)) {
      throw new HttpError(403, "No tiene permisos para realizar esta acción");
    }

    next();
  };
}

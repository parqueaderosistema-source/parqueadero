import { Router } from "express";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

import { permitirRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin",
  verificarAutenticacion,
  permitirRoles("administrador"),
  (_request, response) => {
    response.status(200).json({
      ok: true,
      message: "Acceso permitido al administrador",
    });
  },
);

router.get(
  "/trabajador",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  (_request, response) => {
    response.status(200).json({
      ok: true,
      message: "Acceso permitido al módulo operativo",
    });
  },
);

export default router;

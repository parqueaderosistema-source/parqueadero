import { Router } from "express";

import {
  actualizarTipo,
  crearTipo,
  listarTipos,
  listarTiposActivos,
} from "../controllers/tipoVehiculo.controller.js";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

import { permitirRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Administrador y trabajador pueden consultar
// los tipos activos para registrar vehículos.
router.get(
  "/activos",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  listarTiposActivos,
);

// Solo administrador
router.get(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador"),
  listarTipos,
);

router.post(
  "/",
  verificarAutenticacion,
  permitirRoles("administrador"),
  crearTipo,
);

router.patch(
  "/:id",
  verificarAutenticacion,
  permitirRoles("administrador"),
  actualizarTipo,
);

export default router;

import { Router } from "express";

import {
  actualizarTipo,
  crearTipo,
  listarTipos,
  listarTiposActivos,
} from "../controllers/tipoVehiculo.controller.js";

import { ROLES_OPERACION } from "../config/roles.js";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

import { permitirRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verificarAutenticacion);

// Administrador y trabajador consultan los tipos activos para registrar vehículos.
router.get("/activos", permitirRoles(...ROLES_OPERACION), listarTiposActivos);

// Solo administrador
const soloAdministrador = permitirRoles("administrador");

router.get("/", soloAdministrador, listarTipos);

router.post("/", soloAdministrador, crearTipo);

router.patch("/:id", soloAdministrador, actualizarTipo);

export default router;

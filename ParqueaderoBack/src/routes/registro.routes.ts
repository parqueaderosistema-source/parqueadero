import { Router } from "express";

import {
  buscarPorPlaca,
  listarVehiculosDentro,
  recaudoHoy,
  registrarEntrada,
  registrarSalida,
  resumenAdministrador,
  resumenHoy,
} from "../controllers/registro.controller.js";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

import { permitirRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post(
  "/entrada",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  registrarEntrada,
);

router.get(
  "/dentro",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  listarVehiculosDentro,
);
router.get(
  "/buscar/:placa",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  buscarPorPlaca,
);

router.patch(
  "/salida/:placa",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  registrarSalida,
);

router.get(
  "/recaudo/hoy",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  recaudoHoy,
);

router.get(
  "/resumen/hoy",
  verificarAutenticacion,
  permitirRoles("administrador", "trabajador"),
  resumenHoy,
);

// Solo administrador
router.get(
  "/resumen/admin",
  verificarAutenticacion,
  permitirRoles("administrador"),
  resumenAdministrador,
);

export default router;

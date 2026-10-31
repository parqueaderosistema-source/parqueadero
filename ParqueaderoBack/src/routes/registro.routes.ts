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

import { ROLES_OPERACION } from "../config/roles.js";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

import { permitirRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verificarAutenticacion);

// Administrador y trabajador
const operacion = permitirRoles(...ROLES_OPERACION);

router.post("/entrada", operacion, registrarEntrada);

router.get("/dentro", operacion, listarVehiculosDentro);

router.get("/buscar/:placa", operacion, buscarPorPlaca);

router.patch("/salida/:placa", operacion, registrarSalida);

router.get("/recaudo/hoy", operacion, recaudoHoy);

router.get("/resumen/hoy", operacion, resumenHoy);

// Solo administrador
router.get("/resumen/admin", permitirRoles("administrador"), resumenAdministrador);

export default router;

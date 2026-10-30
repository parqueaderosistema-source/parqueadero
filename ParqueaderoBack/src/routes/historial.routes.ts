import { Router } from "express";

import {
  eliminarMes,
  exportarHistorialMes,
  listarHistorial,
  listarMeses,
  prepararEliminacionMes,
} from "../controllers/historial.controller.js";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

import { permitirRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verificarAutenticacion, permitirRoles("administrador"));

// Historial con filtros: mes | desde/hasta, placa, tipoVehiculoId, estado, page, limit
router.get("/", listarHistorial);

router.get("/meses", listarMeses);

router.get("/mes/:periodo/exportar", exportarHistorialMes);

router.get("/mes/:periodo/preparar-eliminacion", prepararEliminacionMes);

router.delete("/mes/:periodo", eliminarMes);

export default router;

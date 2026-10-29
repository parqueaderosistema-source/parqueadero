import { Router } from "express";

import {
  eliminarMes,
  exportarHistorialMes,
  listarMeses,
  prepararEliminacionMes,
  verHistorialMes,
} from "../controllers/historial.controller.js";

import { verificarAutenticacion } from "../middlewares/auth.middleware.js";

import { permitirRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verificarAutenticacion, permitirRoles("administrador"));

router.get("/meses", listarMeses);

router.get("/mes/:periodo", verHistorialMes);
router.get("/mes/:periodo/exportar", exportarHistorialMes);

router.get("/mes/:periodo/preparar-eliminacion", prepararEliminacionMes);

router.delete("/mes/:periodo", eliminarMes);

export default router;

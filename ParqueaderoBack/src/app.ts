import "dotenv/config";

import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import pruebaRoutes from "./routes/prueba.routes.js";
import tipoVehiculoRoutes from "./routes/tipoVehiculo.routes.js";
import registroRoutes from "./routes/registro.routes.js";
import historialRoutes from "./routes/historial.routes.js";

const app: Express = express();

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:4200";

app.use(helmet());

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    // Permite al front leer el nombre del archivo en las descargas (Excel).
    exposedHeaders: ["Content-Disposition"],
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

/**
 * Ruta principal.
 */
app.get("/", (_request, response) => {
  response.status(200).json({
    ok: true,
    message: "Servidor del parqueadero funcionando",
  });
});

/**
 * Ruta de comprobación de la API.
 */
app.get("/api/health", (_request, response) => {
  response.status(200).json({
    ok: true,
    message: "API del parqueadero funcionando correctamente",
  });
});

/**
 * Siempre debe ir al final.
 */
app.use("/api/historial", historialRoutes);
app.use("/api/registros", registroRoutes);
app.use("/api/tipos-vehiculo", tipoVehiculoRoutes);
app.use("/api/prueba", pruebaRoutes);
app.use("/api/auth", authRoutes);
app.use((_request, response) => {
  response.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
  });
});

export default app;

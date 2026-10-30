import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";

import { opcionesCors } from "./config/cors.js";
import { env } from "./config/env.js";
import {
  manejarErrores,
  rutaNoEncontrada,
} from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import tipoVehiculoRoutes from "./routes/tipoVehiculo.routes.js";
import registroRoutes from "./routes/registro.routes.js";
import historialRoutes from "./routes/historial.routes.js";

const app: Express = express();

// Detrás de un proxy, para que el rate limit use la IP real del cliente.
app.set("trust proxy", env.TRUST_PROXY);

app.use(helmet());

app.use(cors(opcionesCors));

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    message: "Demasiadas peticiones. Intente nuevamente más tarde.",
  },
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

app.use("/api/historial", historialRoutes);
app.use("/api/registros", registroRoutes);
app.use("/api/tipos-vehiculo", tipoVehiculoRoutes);
app.use("/api/auth", authRoutes);

/**
 * Siempre deben ir al final.
 */
app.use(rutaNoEncontrada);
app.use(manejarErrores);

export default app;

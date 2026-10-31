import type { Server } from "node:http";

import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import app from "./app.js";

/**
 * Deja de aceptar peticiones, espera las que están en curso
 * y cierra la conexión a MongoDB.
 */
function cerrarAlRecibirSenal(server: Server): void {
  const cerrar = (senal: string) => {
    console.log(`${senal} recibida. Cerrando el servidor...`);

    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });

    // Si algo queda colgado, se fuerza la salida.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once("SIGINT", () => cerrar("SIGINT"));
  process.once("SIGTERM", () => cerrar("SIGTERM"));
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${env.PORT}`);
    });

    cerrarAlRecibirSenal(server);
  } catch (error) {
    console.error("No se pudo iniciar el servidor.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exit(1);
  }
}

void startServer();

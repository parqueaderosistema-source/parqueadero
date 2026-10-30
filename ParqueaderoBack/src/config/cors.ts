import type { CorsOptions } from "cors";

import { env, esProduccion } from "./env.js";

/**
 * En desarrollo se acepta el front en cualquier puerto local
 * (ng serve cambia de puerto si el 4200 está ocupado).
 * En producción solo se acepta FRONTEND_URL.
 */
const origenLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function origenPermitido(origen: string | undefined): boolean {
  if (!origen || origen === env.FRONTEND_URL) {
    return true;
  }

  return !esProduccion && origenLocal.test(origen);
}

export const opcionesCors: CorsOptions = {
  origin: (origen, callback) => callback(null, origenPermitido(origen)),
  credentials: true,
  // Permite al front leer el nombre del archivo en las descargas (Excel).
  exposedHeaders: ["Content-Disposition"],
};

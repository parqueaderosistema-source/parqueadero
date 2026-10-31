import { DateTime } from "luxon";

import { env } from "../config/env.js";

/**
 * Zona horaria utilizada por el parqueadero.
 */
export function obtenerZonaHoraria(): string {
  return env.APP_TIMEZONE;
}

export interface RangoFechas {
  /** Momento de referencia en la zona del parqueadero. */
  inicioLocal: DateTime;
  inicioUtc: Date;
  finUtc: Date;
}

/**
 * Inicio y fin del día actual en America/Bogota, convertidos a UTC.
 */
export function obtenerRangoDiaActual(): RangoFechas {
  const inicioLocal = DateTime.now()
    .setZone(obtenerZonaHoraria())
    .startOf("day");

  return {
    inicioLocal,
    inicioUtc: inicioLocal.toUTC().toJSDate(),
    finUtc: inicioLocal.endOf("day").toUTC().toJSDate(),
  };
}

/**
 * Rango de días completos (AAAA-MM-DD) en America/Bogota, convertido a UTC.
 * desde y hasta son inclusivos; cualquiera de los dos puede faltar.
 */
export function obtenerRangoDias(
  desde?: string,
  hasta?: string,
): { inicioUtc?: Date; finUtc?: Date } {
  const timezone = obtenerZonaHoraria();

  const leer = (valor: string) => {
    const fecha = DateTime.fromISO(valor, { zone: timezone });

    if (!fecha.isValid) {
      throw new Error(`La fecha ${valor} no es válida`);
    }

    return fecha;
  };

  return {
    inicioUtc: desde
      ? leer(desde).startOf("day").toUTC().toJSDate()
      : undefined,
    finUtc: hasta ? leer(hasta).endOf("day").toUTC().toJSDate() : undefined,
  };
}

/**
 * Inicio y fin de un mes (AAAA-MM) en America/Bogota, convertidos a UTC.
 * Sin periodo, usa el mes en curso.
 */
export function obtenerRangoMes(periodo?: string): RangoFechas {
  const timezone = obtenerZonaHoraria();

  let inicioLocal: DateTime;

  if (periodo === undefined) {
    inicioLocal = DateTime.now().setZone(timezone).startOf("month");
  } else {
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      throw new Error("El periodo debe tener el formato AAAA-MM");
    }

    inicioLocal = DateTime.fromFormat(periodo, "yyyy-MM", {
      zone: timezone,
    }).startOf("month");

    if (!inicioLocal.isValid) {
      throw new Error("El periodo no es válido");
    }
  }

  return {
    inicioLocal,
    inicioUtc: inicioLocal.toUTC().toJSDate(),
    finUtc: inicioLocal.endOf("month").toUTC().toJSDate(),
  };
}

import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";

import { env, esProduccion } from "../config/env.js";

export const COOKIE_SESION = "parqueadero_session";

const DURACION_SESION_HORAS = 8;

const ALGORITMO = "HS256";

/**
 * Opciones compartidas por la cookie de sesión al crearla y al borrarla
 * (deben coincidir para que el navegador la elimine).
 * En producción el front (Vercel) y el back (Render) están en dominios
 * distintos: la cookie necesita sameSite "none", que exige secure.
 */
const opcionesCookie: CookieOptions = {
  httpOnly: true,
  secure: esProduccion,
  sameSite: esProduccion ? "none" : "lax",
  path: "/",
};

export const opcionesCookieSesion: CookieOptions = {
  ...opcionesCookie,
  maxAge: DURACION_SESION_HORAS * 60 * 60 * 1000,
};

export const opcionesBorrarCookieSesion: CookieOptions = opcionesCookie;

/**
 * El token solo identifica al usuario. El rol y si está activo
 * se consultan en la base de datos en cada petición.
 */
export function firmarTokenSesion(usuarioId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: usuarioId,
    algorithm: ALGORITMO,
    expiresIn: `${DURACION_SESION_HORAS}h`,
  });
}

/**
 * Devuelve el id del usuario, o null si el token no es válido o expiró.
 */
export function verificarTokenSesion(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: [ALGORITMO],
    });

    return typeof payload === "object" && typeof payload.sub === "string"
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}

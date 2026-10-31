import { z } from "zod";

/**
 * Código de MongoDB para violación de índice único.
 */
export function esErrorDuplicado(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

/**
 * Id de MongoDB (24 caracteres hexadecimales).
 */
export const objectIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "El identificador no es válido");

/**
 * Collation para comparar textos sin distinguir mayúsculas ni tildes
 * ("Camión" = "camion"). Evita construir regex con texto del usuario.
 */
export const COLLATION_SIN_MAYUSCULAS = { locale: "es", strength: 1 } as const;

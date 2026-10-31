import { z } from "zod";

/**
 * Normaliza una placa: mayúsculas, sin espacios ni guiones.
 * Ejemplo: " abc-456 " → "ABC456"
 */
export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[\s-]+/g, "");
}

export const registrarEntradaSchema = z.object({
  placa: z
    .string({ message: "La placa es obligatoria" })
    .transform(normalizarPlaca)
    .pipe(
      z
        .string()
        .min(3, "La placa debe tener al menos 3 caracteres")
        .max(20, "La placa es demasiado larga")
        .regex(/^[A-Z0-9]+$/, "La placa contiene caracteres no permitidos"),
    ),

  tipoVehiculoId: z
    .string({ message: "Debe seleccionar un tipo de vehículo" })
    .trim()
    .min(1, "Debe seleccionar un tipo de vehículo"),

  // Vacío, nulo o solo espacios se convierte en null.
  // Si es obligatorio o no permitido lo decide el servicio según el tipo.
  tipoVehiculoPersonalizado: z
    .string({ message: "El tipo personalizado debe ser texto" })
    .nullish()
    .transform((valor) => valor?.trim() || null),

  tiempoEstimado: z
    .string()
    .trim()
    .max(100, "El tiempo estimado es demasiado largo")
    .optional()
    .default(""),

  observacion: z
    .string()
    .trim()
    .max(500, "La observación es demasiado larga")
    .optional()
    .default(""),
});

export type RegistrarEntradaInput = z.infer<typeof registrarEntradaSchema>;
export const registrarSalidaSchema = z.object({
  valorCobrado: z
    .number({
      message: "El valor cobrado debe ser numérico",
    })
    .positive("El valor cobrado debe ser mayor que 0")
    .max(100000000, "El valor cobrado es demasiado alto"),

  observacion: z
    .string()
    .trim()
    .max(500, "La observación es demasiado larga")
    .optional(),
});

/**
 * Placa recibida en la URL (/buscar/:placa, /salida/:placa).
 */
export const placaParamsSchema = z.object({
  placa: z
    .string()
    .transform(normalizarPlaca)
    .pipe(
      z
        .string()
        .min(1, "La placa es obligatoria")
        .max(20, "La placa es demasiado larga")
        .regex(/^[A-Z0-9]+$/, "La placa contiene caracteres no permitidos"),
    ),
});

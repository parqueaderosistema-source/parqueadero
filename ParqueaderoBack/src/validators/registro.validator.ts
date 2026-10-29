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

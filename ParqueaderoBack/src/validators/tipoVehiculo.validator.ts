import { z } from "zod";

export const crearTipoVehiculoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre es obligatorio")
    .max(80, "El nombre es demasiado largo"),
});

export const actualizarTipoVehiculoSchema = z.object({
  nombre: z.string().trim().min(2).max(80).optional(),

  activo: z.boolean().optional(),
});

import { z } from "zod";

import { objectIdSchema } from "../utils/mongo.js";

const nombreSchema = z
  .string({ message: "El nombre es obligatorio" })
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(80, "El nombre es demasiado largo");

export const crearTipoVehiculoSchema = z.object({
  nombre: nombreSchema,
});

export const actualizarTipoVehiculoSchema = z
  .object({
    nombre: nombreSchema.optional(),

    activo: z.boolean({ message: "activo debe ser true o false" }).optional(),
  })
  .refine(
    (datos) => datos.nombre !== undefined || datos.activo !== undefined,
    { message: "Debe enviar nombre o activo" },
  );

export const tipoVehiculoParamsSchema = z.object({
  id: objectIdSchema,
});

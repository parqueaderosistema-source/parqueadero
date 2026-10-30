import { z } from "zod";
import { DateTime } from "luxon";

import { normalizarPlaca } from "./registro.validator.js";

const fechaDia = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD")
  .refine((valor) => DateTime.fromISO(valor).isValid, "La fecha no es válida");

export const LIMITE_MAXIMO_HISTORIAL = 100;

export const filtrosHistorialSchema = z
  .object({
    mes: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El mes debe tener el formato AAAA-MM")
      .optional(),

    desde: fechaDia.optional(),

    hasta: fechaDia.optional(),

    placa: z
      .string()
      .transform(normalizarPlaca)
      .pipe(
        z
          .string()
          .min(1, "La placa no puede estar vacía")
          .max(20, "La placa es demasiado larga")
          .regex(/^[A-Z0-9]+$/, "La placa contiene caracteres no permitidos"),
      )
      .optional(),

    tipoVehiculoId: z
      .string()
      .regex(/^[a-f0-9]{24}$/i, "El tipo de vehículo no es válido")
      .optional(),

    estado: z
      .enum(["dentro", "retirado", "anulado"], {
        message: "El estado debe ser dentro, retirado o anulado",
      })
      .optional(),

    page: z.coerce
      .number({ message: "page debe ser numérico" })
      .int("page debe ser un número entero")
      .min(1, "page debe ser mayor o igual a 1")
      .default(1),

    limit: z.coerce
      .number({ message: "limit debe ser numérico" })
      .int("limit debe ser un número entero")
      .min(1, "limit debe ser mayor o igual a 1")
      .max(
        LIMITE_MAXIMO_HISTORIAL,
        `limit no puede ser mayor que ${LIMITE_MAXIMO_HISTORIAL}`,
      )
      .default(25),
  })
  .refine((datos) => !(datos.mes && (datos.desde || datos.hasta)), {
    message: "Use mes o el rango desde/hasta, no ambos",
    path: ["mes"],
  })
  .refine(
    (datos) => !(datos.desde && datos.hasta && datos.desde > datos.hasta),
    {
      message: "La fecha desde no puede ser posterior a hasta",
      path: ["desde"],
    },
  );

export type FiltrosHistorial = z.infer<typeof filtrosHistorialSchema>;

export const periodoSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El periodo debe tener el formato AAAA-MM");

export const eliminarMesSchema = z.object({
  confirmacion: z
    .string({ message: "Debe escribir la confirmación" })
    .trim()
    .min(1, "Debe escribir la confirmación"),

  modo: z.enum(["descargar-y-eliminar", "sin-descargar"], {
    message: "El modo debe ser descargar-y-eliminar o sin-descargar",
  }),

  descargado: z
    .boolean({ message: "descargado debe ser true o false" })
    .optional()
    .default(false),
});

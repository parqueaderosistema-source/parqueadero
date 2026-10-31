import { z } from "zod";

import { HttpError } from "./httpError.js";

/**
 * Valida datos de entrada con un esquema.
 * Si no son válidos lanza un 400 con los errores por campo,
 * que el manejador global de errores convierte en respuesta.
 */
export function validar<T extends z.ZodType>(
  schema: T,
  datos: unknown,
  mensaje = "Los datos enviados no son válidos",
): z.infer<T> {
  const resultado = schema.safeParse(datos ?? {});

  if (!resultado.success) {
    const { formErrors, fieldErrors } = z.flattenError(resultado.error);

    // Errores de todo el objeto (refine) no tienen campo: van en el mensaje.
    throw new HttpError(
      400,
      formErrors[0] ?? mensaje,
      fieldErrors as Record<string, string[] | undefined>,
    );
  }

  return resultado.data;
}

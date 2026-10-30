import { z } from "zod";

export const loginSchema = z.object({
  correo: z
    .string({ message: "El correo es obligatorio" })
    .trim()
    .email("El correo no es válido")
    .max(150, "El correo es demasiado largo"),

  password: z
    .string({ message: "La contraseña es obligatoria" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(200, "La contraseña es demasiado larga"),
});

export type LoginInput = z.infer<typeof loginSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  correo: z.string().trim().email("El correo no es válido").max(150),

  password: z.string().min(8, "La contraseña es obligatoria").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;

import "dotenv/config";

import { z } from "zod";

/**
 * Única fuente de configuración del back.
 * Se valida al arrancar: si falta algo o es inseguro, el proceso
 * se detiene con un mensaje claro en vez de fallar en una petición.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  FRONTEND_URL: z.url("FRONTEND_URL debe ser una URL").default(
    "http://localhost:4200",
  ),

  MONGODB_URI: z
    .string({ message: "MONGODB_URI no está configurada" })
    .min(1, "MONGODB_URI no está configurada"),

  /**
   * Servidores DNS para resolver la URI mongodb+srv en redes
   * con problemas de SRV. Separados por coma. Opcional.
   */
  MONGODB_DNS_SERVERS: z
    .string()
    .optional()
    .transform((valor) =>
      valor
        ? valor
            .split(",")
            .map((servidor) => servidor.trim())
            .filter(Boolean)
        : [],
    ),

  JWT_SECRET: z
    .string({ message: "JWT_SECRET no está configurado" })
    .min(32, "JWT_SECRET debe tener mínimo 32 caracteres"),

  APP_TIMEZONE: z.string().default("America/Bogota"),

  /**
   * Número de proxies delante del back (nginx, balanceador).
   * Necesario para que el rate limit vea la IP real del cliente.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

function cargarEnv() {
  const resultado = envSchema.safeParse(process.env);

  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Configuración inválida en .env:\n${detalle}`);
  }

  return resultado.data;
}

export const env = cargarEnv();

export const esProduccion = env.NODE_ENV === "production";

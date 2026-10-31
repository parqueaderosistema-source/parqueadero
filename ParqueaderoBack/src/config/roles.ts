/**
 * Roles del sistema. Única definición: la usan el modelo,
 * el token de sesión y los middlewares de autorización.
 */
export const ROLES = ["administrador", "trabajador"] as const;

export type Rol = (typeof ROLES)[number];

/**
 * Roles que pueden operar el parqueadero (entradas, salidas, caja).
 */
export const ROLES_OPERACION: Rol[] = ["administrador", "trabajador"];

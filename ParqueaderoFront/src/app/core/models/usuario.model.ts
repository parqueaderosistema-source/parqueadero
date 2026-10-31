export type RolUsuario = 'administrador' | 'trabajador';

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  administrador: 'Administrador',
  trabajador: 'Trabajador',
};

export interface Usuario {
  id: string;
  nombre?: string;
  correo?: string;
  rol: RolUsuario;
}

export interface LoginResponse {
  ok: boolean;
  message: string;
  usuario: Usuario;
}

export interface SessionResponse {
  ok: boolean;
  usuario: Usuario;
}

/**
 * Pantalla de inicio de cada rol (después del login
 * o cuando intenta entrar a un panel que no le corresponde).
 */
export const RUTA_INICIO_POR_ROL: Record<RolUsuario, string> = {
  administrador: '/admin',
  trabajador: '/trabajador',
};

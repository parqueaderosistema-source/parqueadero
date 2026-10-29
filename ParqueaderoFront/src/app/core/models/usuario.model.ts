export type RolUsuario = 'administrador' | 'trabajador';

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

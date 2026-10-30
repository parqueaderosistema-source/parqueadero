export interface EnlaceMenu {
  etiqueta: string;
  ruta: string;

  /**
   * true para rutas raíz como "/trabajador",
   * para que no queden activas en todas sus hijas.
   */
  exacto?: boolean;
}

export interface GrupoMenu {
  /**
   * Opcional: si el panel tiene un solo grupo
   * no hace falta mostrar título.
   */
  titulo?: string;

  enlaces: EnlaceMenu[];
}

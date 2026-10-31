/**
 * Agrega tipoMostrado: el tipo personalizado si existe,
 * o el nombre del tipo guardado al momento de la entrada.
 */
export function conTipoMostrado<
  T extends {
    tipoVehiculoNombre: string;
    tipoVehiculoPersonalizado?: string | null;
  },
>(registro: T) {
  return {
    ...registro,
    tipoVehiculoPersonalizado: registro.tipoVehiculoPersonalizado ?? null,
    tipoMostrado:
      registro.tipoVehiculoPersonalizado || registro.tipoVehiculoNombre,
  };
}

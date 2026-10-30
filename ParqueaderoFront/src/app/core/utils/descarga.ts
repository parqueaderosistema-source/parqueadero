/**
 * Guarda un Blob en el equipo con el nombre indicado.
 */
export function guardarArchivo(archivo: Blob, nombre: string): void {
  const url = URL.createObjectURL(archivo);

  const enlace = document.createElement('a');

  enlace.href = url;

  enlace.download = nombre;

  document.body.appendChild(enlace);

  enlace.click();

  enlace.remove();

  /**
   * Se libera después para que el navegador alcance a iniciar la descarga.
   */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

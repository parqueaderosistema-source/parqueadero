/**
 * Error de negocio con el código HTTP que debe devolver la API.
 * Los errores que no sean HttpError se responden como 500.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /**
     * Errores por campo ({ campo: [mensajes] }) para los formularios.
     */
    public readonly errores?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

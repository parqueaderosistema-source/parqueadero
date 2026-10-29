/**
 * Error de negocio con el código HTTP que debe devolver la API.
 * Los errores que no sean HttpError se responden como 500.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

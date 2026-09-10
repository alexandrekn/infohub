export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message = "Não autenticado.") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Você não tem permissão para fazer isso.") {
    return new ApiError(403, message);
  }

  static notFound(message = "Recurso não encontrado.") {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }
}

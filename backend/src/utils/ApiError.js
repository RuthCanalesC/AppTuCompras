/**
 * ============================================================
 * ApiError — Error controlado de la aplicación
 * ------------------------------------------------------------
 * Permite lanzar errores con un código HTTP asociado desde
 * cualquier capa (servicio o repositorio) y que el middleware
 * de errores lo traduzca a una respuesta JSON uniforme.
 *
 *   throw ApiError.badRequest('El nombre es obligatorio');
 *   throw ApiError.notFound('Cliente no encontrado');
 * ============================================================
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static internal(message = 'Error interno del servidor') {
    return new ApiError(500, message);
  }

  /**
   * Convierte errores de MySQL/MariaDB en errores de negocio legibles.
   * - SIGNAL 45000 de los procedimientos almacenados -> 400 con su mensaje
   * - ER_DUP_ENTRY -> 409 conflicto
   * - Otros -> 500
   */
  static fromDbError(err) {
    // Mensajes de negocio lanzados por los SP y triggers (SIGNAL SQLSTATE 45000)
    if (err.sqlState === '45000') {
      return new ApiError(400, err.sqlMessage || err.message);
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return new ApiError(409, 'Ya existe un registro con esos datos únicos.');
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return new ApiError(409, 'No se puede eliminar: el registro tiene movimientos asociados.');
    }
    return new ApiError(500, 'Error de base de datos', err.message);
  }
}

module.exports = ApiError;

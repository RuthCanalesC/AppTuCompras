/**
 * ============================================================
 * Middlewares de manejo de errores (capa transversal)
 * ------------------------------------------------------------
 * notFoundHandler : responde 404 para rutas inexistentes.
 * errorHandler    : traduce cualquier error a una respuesta
 *                   JSON uniforme: { ok, mensaje, detalles? }
 * ============================================================
 */
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function notFoundHandler(req, res, _next) {
  res.status(404).json({
    ok: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Errores de MySQL que no fueron traducidos antes
  const apiError = err instanceof ApiError ? err : ApiError.fromDbError(err);

  const body = {
    ok: false,
    mensaje: apiError.message,
  };

  if (apiError.details) body.detalles = apiError.details;

  // En desarrollo se incluye el stack para depurar más rápido
  if (env.nodeEnv === 'development' && apiError.statusCode === 500) {
    body.stack = err.stack;
  }

  res.status(apiError.statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };

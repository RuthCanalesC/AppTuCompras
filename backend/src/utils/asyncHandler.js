/**
 * ============================================================
 * asyncHandler — envoltura para controladores async
 * ------------------------------------------------------------
 * Express 4 no captura automáticamente los errores de funciones
 * async. Esta envoltura los atrapa y los envía al middleware de
 * errores, evitando repetir try/catch en cada controlador.
 * ============================================================
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

/**
 * ============================================================
 * Middlewares de AUTENTICACIÓN y AUTORIZACIÓN
 * ------------------------------------------------------------
 * authRequired : exige un JWT válido en "Authorization: Bearer <token>"
 *                y coloca el usuario decodificado en req.usuario.
 * requireRole  : exige que el usuario autenticado tenga uno de los
 *                roles indicados (autorización por rol).
 *
 * Aplican la matriz de privilegios de la Fase 11 del proyecto:
 *   Administrador -> acceso total
 *   Operaciones   -> clientes y cotizaciones; catálogos solo lectura;
 *                    SIN acceso a finanzas (compras, abonos, envíos,
 *                    entregas, reportes) ni a gestión de usuarios.
 * ============================================================
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function authRequired(req, _res, next) {
  const encabezado = req.headers.authorization || '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Autenticación requerida: envíe el token en "Authorization: Bearer <token>".'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.usuario = {
      id_usuario: payload.sub,
      usuario: payload.usuario,
      nombre_completo: payload.nombre,
      rol: payload.rol,
    };
    return next();
  } catch (err) {
    const mensaje = err.name === 'TokenExpiredError'
      ? 'La sesión expiró; inicie sesión nuevamente.'
      : 'Token inválido.';
    return next(new ApiError(401, mensaje));
  }
}

function requireRole(...rolesPermitidos) {
  return (req, _res, next) => {
    if (!req.usuario) {
      return next(new ApiError(401, 'Autenticación requerida.'));
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(new ApiError(
        403,
        `Acceso denegado: se requiere rol ${rolesPermitidos.join(' o ')} (usted es ${req.usuario.rol}).`
      ));
    }
    return next();
  };
}

module.exports = { authRequired, requireRole };

/**
 * ============================================================
 * Servicio de AUTENTICACIÓN / USUARIOS (capa de lógica de negocio)
 * ------------------------------------------------------------
 * - login: compara la contraseña con bcrypt y firma un JWT que
 *   incluye el rol (base de la autorización).
 * - Seguridad: el mensaje de error de login es el MISMO para
 *   usuario inexistente y contraseña incorrecta (no se revela
 *   cuál falló) y nunca se expone password_hash.
 * ============================================================
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const authRepository = require('./auth.repository');

const ROLES = ['Administrador', 'Operaciones'];
const PASSWORD_MIN = 8;

function sanitizar(usuario) {
  if (!usuario) return usuario;
  const { password_hash, ...resto } = usuario;
  return resto;
}

const authService = {
  async login({ usuario, password }) {
    if (!usuario || !password) {
      throw ApiError.badRequest('Los campos "usuario" y "password" son obligatorios.');
    }

    const cuenta = await authRepository.findByUsuario(String(usuario).trim());

    // Mismo mensaje si no existe o la contraseña no coincide
    const credencialesInvalidas = new ApiError(401, 'Usuario o contraseña incorrectos.');

    if (!cuenta) throw credencialesInvalidas;
    if (cuenta.estado !== 'Activo') {
      throw new ApiError(403, 'La cuenta está inactiva; contacte al administrador.');
    }

    const coincide = await bcrypt.compare(password, cuenta.password_hash);
    if (!coincide) throw credencialesInvalidas;

    const token = jwt.sign(
      {
        sub: cuenta.id_usuario,
        usuario: cuenta.usuario,
        nombre: cuenta.nombre_completo,
        rol: cuenta.rol,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    await authRepository.registrarAcceso(cuenta.id_usuario);

    return {
      token,
      expira_en: env.jwt.expiresIn,
      usuario: sanitizar(cuenta),
    };
  },

  async perfil(idUsuario) {
    const cuenta = await authRepository.findById(idUsuario);
    if (!cuenta) throw ApiError.notFound('Usuario no encontrado.');
    return cuenta;
  },

  async listarUsuarios() {
    return authRepository.findAll();
  },

  /** Alta de usuario (solo Administrador, validado en la ruta). */
  async crearUsuario(datos) {
    for (const campo of ['nombre_completo', 'usuario', 'password']) {
      if (!datos[campo] || String(datos[campo]).trim() === '') {
        throw ApiError.badRequest(`El campo "${campo}" es obligatorio.`);
      }
    }
    if (String(datos.password).length < PASSWORD_MIN) {
      throw ApiError.badRequest(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
    }
    if (datos.rol && !ROLES.includes(datos.rol)) {
      throw ApiError.badRequest(`Rol inválido. Use: ${ROLES.join(', ')}`);
    }

    const password_hash = await bcrypt.hash(datos.password, 10);

    try {
      const id = await authRepository.create({ ...datos, password_hash });
      return authRepository.findById(id);
    } catch (err) {
      throw ApiError.fromDbError(err); // usuario/email duplicado -> 409
    }
  },

  /** Activa/inactiva una cuenta (solo Administrador). */
  async cambiarEstado(idUsuario, estado, usuarioActual) {
    if (!['Activo', 'Inactivo'].includes(estado)) {
      throw ApiError.badRequest('Estado inválido. Use: Activo, Inactivo');
    }
    const id = Number(idUsuario);
    if (id === usuarioActual.id_usuario) {
      throw ApiError.conflict('No puede inactivar su propia cuenta.');
    }
    const cuenta = await authRepository.findById(id);
    if (!cuenta) throw ApiError.notFound(`No existe un usuario con ID ${idUsuario}.`);

    await authRepository.updateEstado(id, estado);
    return authRepository.findById(id);
  },
};

module.exports = authService;

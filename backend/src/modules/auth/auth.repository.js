/**
 * ============================================================
 * Repositorio de AUTENTICACIÓN / USUARIOS (capa de acceso a datos)
 * ============================================================
 */
const { pool } = require('../../config/db');

const authRepository = {
  async findByUsuario(usuario) {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre_completo, usuario, email,
              password_hash, rol, estado, fecha_creacion, ultimo_acceso
         FROM usuarios
        WHERE usuario = :usuario`,
      { usuario }
    );
    return rows[0] || null;
  },

  async findById(idUsuario) {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre_completo, usuario, email,
              rol, estado, fecha_creacion, ultimo_acceso
         FROM usuarios
        WHERE id_usuario = :idUsuario`,
      { idUsuario }
    );
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombre_completo, usuario, email,
              rol, estado, fecha_creacion, ultimo_acceso
         FROM usuarios
        ORDER BY id_usuario`
    );
    return rows;
  },

  async create(datos) {
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre_completo, usuario, email, password_hash, rol)
       VALUES (:nombre, :usuario, :email, :hash, :rol)`,
      {
        nombre: datos.nombre_completo,
        usuario: datos.usuario,
        email: datos.email ?? null,
        hash: datos.password_hash,
        rol: datos.rol ?? 'Operaciones',
      }
    );
    return result.insertId;
  },

  async updateEstado(idUsuario, estado) {
    const [result] = await pool.query(
      `UPDATE usuarios SET estado = :estado WHERE id_usuario = :idUsuario`,
      { idUsuario, estado }
    );
    return result.affectedRows > 0;
  },

  async registrarAcceso(idUsuario) {
    await pool.query(
      `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = :idUsuario`,
      { idUsuario }
    );
  },
};

module.exports = authRepository;

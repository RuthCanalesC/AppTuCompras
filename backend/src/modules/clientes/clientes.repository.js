/**
 * ============================================================
 * Repositorio de CLIENTES (capa de acceso a datos)
 * ------------------------------------------------------------
 * Única capa que habla SQL. Usa el procedimiento almacenado
 * sp_registrar_cliente para las altas (así las validaciones de
 * negocio viven en la base de datos y en la API a la vez).
 * ============================================================
 */
const { pool } = require('../../config/db');

const clientesRepository = {
  /** Lista clientes con filtros opcionales por estado, tipo y búsqueda. */
  async findAll({ estado, tipo, buscar, limit = 50, offset = 0 } = {}) {
    const condiciones = [];
    const params = { limit: Number(limit), offset: Number(offset) };

    if (estado) {
      condiciones.push('estado = :estado');
      params.estado = estado;
    }
    if (tipo) {
      condiciones.push('tipo_cliente = :tipo');
      params.tipo = tipo;
    }
    if (buscar) {
      condiciones.push(
        '(nombre LIKE :buscar OR apellido LIKE :buscar OR identidad LIKE :buscar OR telefono LIKE :buscar)'
      );
      params.buscar = `%${buscar}%`;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT id_cliente, nombre, apellido, identidad, telefono, email,
              direccion, ciudad, tipo_cliente, fecha_registro, estado
         FROM clientes
         ${where}
        ORDER BY apellido, nombre
        LIMIT :limit OFFSET :offset`,
      params
    );
    return rows;
  },

  /** Busca un cliente por su ID. */
  async findById(idCliente) {
    const [rows] = await pool.query(
      `SELECT id_cliente, nombre, apellido, identidad, telefono, email,
              direccion, ciudad, tipo_cliente, fecha_registro, estado
         FROM clientes
        WHERE id_cliente = :idCliente`,
      { idCliente }
    );
    return rows[0] || null;
  },

  /** Alta de cliente a través del procedimiento almacenado. */
  async create(datos) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `CALL sp_registrar_cliente(:nombre, :apellido, :identidad, :telefono,
                                   :email, :direccion, :ciudad, :tipoCliente,
                                   @id_cliente)`,
        {
          nombre: datos.nombre,
          apellido: datos.apellido,
          identidad: datos.identidad,
          telefono: datos.telefono,
          email: datos.email ?? null,
          direccion: datos.direccion ?? null,
          ciudad: datos.ciudad ?? null,
          tipoCliente: datos.tipo_cliente ?? null,
        }
      );
      const [[{ id_cliente }]] = await conn.query('SELECT @id_cliente AS id_cliente');
      return id_cliente;
    } finally {
      conn.release();
    }
  },

  /** Actualización de datos de contacto y segmento del cliente. */
  async update(idCliente, datos) {
    const [result] = await pool.query(
      `UPDATE clientes
          SET telefono     = COALESCE(:telefono, telefono),
              email        = COALESCE(:email, email),
              direccion    = COALESCE(:direccion, direccion),
              ciudad       = COALESCE(:ciudad, ciudad),
              tipo_cliente = COALESCE(:tipoCliente, tipo_cliente),
              estado       = COALESCE(:estado, estado)
        WHERE id_cliente = :idCliente`,
      {
        idCliente,
        telefono: datos.telefono ?? null,
        email: datos.email ?? null,
        direccion: datos.direccion ?? null,
        ciudad: datos.ciudad ?? null,
        tipoCliente: datos.tipo_cliente ?? null,
        estado: datos.estado ?? null,
      }
    );
    return result.affectedRows > 0;
  },
};

module.exports = clientesRepository;

/**
 * ============================================================
 * Repositorio de CASILLEROS (catálogo logístico internacional)
 * ============================================================
 */
const { pool } = require('../../config/db');

const casillerosRepository = {
  async findAll({ estado, pais } = {}) {
    const condiciones = [];
    const params = {};
    if (estado) {
      condiciones.push('estado = :estado');
      params.estado = estado;
    }
    if (pais) {
      condiciones.push('pais = :pais');
      params.pais = pais;
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT id_casillero, nombre, pais, ciudad, direccion,
              costo_por_libra_usd, dias_transito_estimado, estado
         FROM casilleros ${where}
        ORDER BY pais, nombre`,
      params
    );
    return rows;
  },

  async findById(idCasillero) {
    const [rows] = await pool.query(
      `SELECT id_casillero, nombre, pais, ciudad, direccion,
              costo_por_libra_usd, dias_transito_estimado, estado
         FROM casilleros
        WHERE id_casillero = :idCasillero`,
      { idCasillero }
    );
    return rows[0] || null;
  },

  async create(datos) {
    const [result] = await pool.query(
      `INSERT INTO casilleros (nombre, pais, ciudad, direccion,
                               costo_por_libra_usd, dias_transito_estimado, estado)
       VALUES (:nombre, :pais, :ciudad, :direccion,
               :costoPorLibra, :diasTransito, :estado)`,
      {
        nombre: datos.nombre,
        pais: datos.pais,
        ciudad: datos.ciudad,
        direccion: datos.direccion,
        costoPorLibra: datos.costo_por_libra_usd,
        diasTransito: datos.dias_transito_estimado ?? 7,
        estado: datos.estado ?? 'Activo',
      }
    );
    return result.insertId;
  },

  /**
   * Actualiza el casillero. Si cambia costo_por_libra_usd, el trigger
   * trg_casilleros_au_auditoria registra el cambio en log_auditoria.
   */
  async update(idCasillero, datos) {
    const [result] = await pool.query(
      `UPDATE casilleros
          SET nombre                 = COALESCE(:nombre, nombre),
              pais                   = COALESCE(:pais, pais),
              ciudad                 = COALESCE(:ciudad, ciudad),
              direccion              = COALESCE(:direccion, direccion),
              costo_por_libra_usd    = COALESCE(:costoPorLibra, costo_por_libra_usd),
              dias_transito_estimado = COALESCE(:diasTransito, dias_transito_estimado),
              estado                 = COALESCE(:estado, estado)
        WHERE id_casillero = :idCasillero`,
      {
        idCasillero,
        nombre: datos.nombre ?? null,
        pais: datos.pais ?? null,
        ciudad: datos.ciudad ?? null,
        direccion: datos.direccion ?? null,
        costoPorLibra: datos.costo_por_libra_usd ?? null,
        diasTransito: datos.dias_transito_estimado ?? null,
        estado: datos.estado ?? null,
      }
    );
    return result.affectedRows > 0;
  },
};

module.exports = casillerosRepository;

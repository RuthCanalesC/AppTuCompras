/**
 * ============================================================
 * Repositorio de PLATAFORMAS (catálogo de tiendas)
 * ============================================================
 */
const { pool } = require('../../config/db');

const plataformasRepository = {
  async findAll({ estado } = {}) {
    const where = estado ? 'WHERE estado = :estado' : '';
    const [rows] = await pool.query(
      `SELECT id_plataforma, nombre, url_sitio, pais_origen, comision_pct, estado
         FROM plataformas ${where}
        ORDER BY nombre`,
      { estado }
    );
    return rows;
  },

  async findById(idPlataforma) {
    const [rows] = await pool.query(
      `SELECT id_plataforma, nombre, url_sitio, pais_origen, comision_pct, estado
         FROM plataformas
        WHERE id_plataforma = :idPlataforma`,
      { idPlataforma }
    );
    return rows[0] || null;
  },

  async create(datos) {
    const [result] = await pool.query(
      `INSERT INTO plataformas (nombre, url_sitio, pais_origen, comision_pct)
       VALUES (:nombre, :urlSitio, :paisOrigen, :comisionPct)`,
      {
        nombre: datos.nombre,
        urlSitio: datos.url_sitio ?? null,
        paisOrigen: datos.pais_origen ?? 'Estados Unidos',
        comisionPct: datos.comision_pct ?? 10.0,
      }
    );
    return result.insertId;
  },

  /**
   * Actualiza la plataforma. Si cambia comision_pct, el trigger
   * trg_plataformas_au_auditoria registra el cambio en log_auditoria.
   */
  async update(idPlataforma, datos) {
    const [result] = await pool.query(
      `UPDATE plataformas
          SET nombre       = COALESCE(:nombre, nombre),
              url_sitio    = COALESCE(:urlSitio, url_sitio),
              pais_origen  = COALESCE(:paisOrigen, pais_origen),
              comision_pct = COALESCE(:comisionPct, comision_pct),
              estado       = COALESCE(:estado, estado)
        WHERE id_plataforma = :idPlataforma`,
      {
        idPlataforma,
        nombre: datos.nombre ?? null,
        urlSitio: datos.url_sitio ?? null,
        paisOrigen: datos.pais_origen ?? null,
        comisionPct: datos.comision_pct ?? null,
        estado: datos.estado ?? null,
      }
    );
    return result.affectedRows > 0;
  },
};

module.exports = plataformasRepository;

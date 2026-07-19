/**
 * ============================================================
 * Repositorio de COTIZACIONES (capa de acceso a datos)
 * ------------------------------------------------------------
 * Usa los procedimientos almacenados de la Fase 8:
 *   - sp_crear_cotizacion            -> alta de cabecera
 *   - sp_agregar_detalle_cotizacion  -> línea + recálculo dinámico
 * y la vista vw_resumen_cotizaciones para el listado gerencial.
 * ============================================================
 */
const { pool } = require('../../config/db');

const cotizacionesRepository = {
  /** Listado gerencial desde la vista (incluye cliente, plataformas y totales). */
  async findAll({ estado, idCliente, limit = 50, offset = 0 } = {}) {
    const condiciones = [];
    const params = { limit: Number(limit), offset: Number(offset) };

    if (estado) {
      condiciones.push('estado = :estado');
      params.estado = estado;
    }
    if (idCliente) {
      condiciones.push('numero_cotizacion IN (SELECT id_cotizacion FROM cotizaciones WHERE id_cliente = :idCliente)');
      params.idCliente = Number(idCliente);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM vw_resumen_cotizaciones
       ${where}
       ORDER BY numero_cotizacion DESC
       LIMIT :limit OFFSET :offset`,
      params
    );
    return rows;
  },

  /** Cabecera de una cotización con los datos del cliente. */
  async findById(idCotizacion) {
    const [rows] = await pool.query(
      `SELECT co.*, CONCAT(cl.nombre, ' ', cl.apellido) AS cliente,
              cl.telefono, cl.tipo_cliente
         FROM cotizaciones co
        INNER JOIN clientes cl ON cl.id_cliente = co.id_cliente
        WHERE co.id_cotizacion = :idCotizacion`,
      { idCotizacion }
    );
    return rows[0] || null;
  },

  /** Líneas de detalle de una cotización con su plataforma. */
  async findDetalle(idCotizacion) {
    const [rows] = await pool.query(
      `SELECT cd.id_detalle_cotizacion, cd.descripcion_producto, cd.url_producto,
              cd.cantidad, cd.precio_unitario_usd, cd.peso_estimado_lb,
              cd.subtotal_usd, pl.id_plataforma, pl.nombre AS plataforma,
              pl.comision_pct
         FROM cotizacion_detalle cd
        INNER JOIN plataformas pl ON pl.id_plataforma = cd.id_plataforma
        WHERE cd.id_cotizacion = :idCotizacion
        ORDER BY cd.id_detalle_cotizacion`,
      { idCotizacion }
    );
    return rows;
  },

  /** Alta de cabecera vía sp_crear_cotizacion. */
  async create({ idCliente, tasaCambio, diasVigencia, observaciones }) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `CALL sp_crear_cotizacion(:idCliente, :tasaCambio, :diasVigencia,
                                  :observaciones, @id_cotizacion)`,
        {
          idCliente,
          tasaCambio,
          diasVigencia: diasVigencia ?? null,
          observaciones: observaciones ?? null,
        }
      );
      const [[{ id_cotizacion }]] = await conn.query('SELECT @id_cotizacion AS id_cotizacion');
      return id_cotizacion;
    } finally {
      conn.release();
    }
  },

  /**
   * Agrega una línea vía sp_agregar_detalle_cotizacion.
   * El SP recalcula automáticamente subtotal, envío estimado,
   * comisión ponderada y totales USD/HNL de la cabecera.
   */
  async addDetalle(idCotizacion, linea) {
    await pool.query(
      `CALL sp_agregar_detalle_cotizacion(:idCotizacion, :idPlataforma,
                                          :descripcion, :urlProducto,
                                          :cantidad, :precioUnitario,
                                          :pesoEstimado, :costoLibra)`,
      {
        idCotizacion,
        idPlataforma: linea.id_plataforma,
        descripcion: linea.descripcion_producto,
        urlProducto: linea.url_producto ?? null,
        cantidad: linea.cantidad ?? 1,
        precioUnitario: linea.precio_unitario_usd,
        pesoEstimado: linea.peso_estimado_lb ?? 0,
        costoLibra: linea.costo_libra_usd,
      }
    );
  },

  /** Cambio de estado de la cotización. */
  async updateEstado(idCotizacion, estado) {
    const [result] = await pool.query(
      `UPDATE cotizaciones SET estado = :estado WHERE id_cotizacion = :idCotizacion`,
      { idCotizacion, estado }
    );
    return result.affectedRows > 0;
  },
};

module.exports = cotizacionesRepository;

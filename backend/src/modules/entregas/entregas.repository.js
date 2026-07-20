/**
 * ============================================================
 * Repositorio de ENTREGAS (capa de acceso a datos)
 * ------------------------------------------------------------
 * La entrega se procesa SIEMPRE vía sp_procesar_entrega, que:
 *   1. Valida que la compra esté Recibida_HN y no entregada.
 *   2. Registra la liquidación contra entrega (si la hay).
 *   3. BLOQUEA la entrega con saldo pendiente (RN-05).
 *   4. Cierra la compra y sus productos.
 *   5. Calcula y guarda el cierre financiero en entregas_ganancias.
 * ============================================================
 */
const { pool } = require('../../config/db');

const entregasRepository = {
  async findAll({ estado, limit = 50, offset = 0 } = {}) {
    const condiciones = [];
    const params = { limit: Number(limit), offset: Number(offset) };

    if (estado) {
      condiciones.push('en.estado = :estado');
      params.estado = estado;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT en.*, CONCAT(cl.nombre, ' ', cl.apellido) AS cliente,
              cl.telefono, cm.total_cliente_hnl,
              eg.ganancia_neta_hnl, eg.margen_pct
         FROM entregas en
        INNER JOIN compras cm           ON cm.id_compra     = en.id_compra
        INNER JOIN cotizaciones co      ON co.id_cotizacion = cm.id_cotizacion
        INNER JOIN clientes cl          ON cl.id_cliente    = co.id_cliente
        LEFT  JOIN entregas_ganancias eg ON eg.id_entrega   = en.id_entrega
        ${where}
        ORDER BY en.id_entrega DESC
        LIMIT :limit OFFSET :offset`,
      params
    );
    return rows;
  },

  /** Entrega con su cierre financiero completo. */
  async findById(idEntrega) {
    const [rows] = await pool.query(
      `SELECT en.*, CONCAT(cl.nombre, ' ', cl.apellido) AS cliente,
              cl.telefono, cm.total_cliente_hnl, cm.estado AS estado_compra
         FROM entregas en
        INNER JOIN compras cm      ON cm.id_compra     = en.id_compra
        INNER JOIN cotizaciones co ON co.id_cotizacion = cm.id_cotizacion
        INNER JOIN clientes cl     ON cl.id_cliente    = co.id_cliente
        WHERE en.id_entrega = :idEntrega`,
      { idEntrega }
    );
    if (!rows[0]) return null;

    const [ganancias] = await pool.query(
      `SELECT * FROM entregas_ganancias WHERE id_entrega = :idEntrega`,
      { idEntrega }
    );
    return { ...rows[0], cierre_financiero: ganancias[0] || null };
  },

  /** Procesa la entrega vía sp_procesar_entrega. */
  async create(datos) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `CALL sp_procesar_entrega(:idCompra, :direccionEntrega, :ciudad,
                                  :metodoEntrega, :costoEntrega, :recibidoPor,
                                  :montoLiquidacion, :metodoPago, @id_entrega)`,
        {
          idCompra: datos.id_compra,
          direccionEntrega: datos.direccion_entrega,
          ciudad: datos.ciudad ?? null,
          metodoEntrega: datos.metodo_entrega ?? null,
          costoEntrega: datos.costo_entrega_local_hnl ?? 0,
          recibidoPor: datos.recibido_por ?? null,
          montoLiquidacion: datos.monto_liquidacion_hnl ?? 0,
          metodoPago: datos.metodo_pago ?? null,
        }
      );
      const [[{ id_entrega }]] = await conn.query('SELECT @id_entrega AS id_entrega');
      return id_entrega;
    } finally {
      conn.release();
    }
  },
};

module.exports = entregasRepository;

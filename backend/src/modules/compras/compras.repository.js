/**
 * ============================================================
 * Repositorio de COMPRAS y ABONOS (capa de acceso a datos)
 * ------------------------------------------------------------
 * Usa la programabilidad de la base de datos:
 *   - sp_registrar_compra          -> alta desde cotización Aprobada
 *   - trg_abonos_bi_validar        -> rechaza abonos inválidos
 *   - trg_abonos_ai_actualizar_saldo -> saldo automático (RN-04)
 *   - vw_compras_pendientes_pago   -> cuentas por cobrar
 * ============================================================
 */
const { pool } = require('../../config/db');

const comprasRepository = {
  /** Lista de compras con el cliente (navegando compra→cotización→cliente). */
  async findAll({ estado, conSaldo, limit = 50, offset = 0 } = {}) {
    const condiciones = [];
    const params = { limit: Number(limit), offset: Number(offset) };

    if (estado) {
      condiciones.push('cm.estado = :estado');
      params.estado = estado;
    }
    if (conSaldo === 'true' || conSaldo === true) {
      condiciones.push('cm.saldo_pendiente_hnl > 0');
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT cm.id_compra, cm.id_cotizacion, cm.fecha_compra,
              cm.costo_productos_usd, cm.tasa_cambio, cm.total_cliente_hnl,
              cm.anticipo_hnl, cm.saldo_pendiente_hnl, cm.estado,
              CONCAT(cl.nombre, ' ', cl.apellido) AS cliente,
              cl.telefono, cl.tipo_cliente
         FROM compras cm
        INNER JOIN cotizaciones co ON co.id_cotizacion = cm.id_cotizacion
        INNER JOIN clientes cl     ON cl.id_cliente    = co.id_cliente
        ${where}
        ORDER BY cm.id_compra DESC
        LIMIT :limit OFFSET :offset`,
      params
    );
    return rows;
  },

  /** Cabecera de una compra con datos del cliente. */
  async findById(idCompra) {
    const [rows] = await pool.query(
      `SELECT cm.*, CONCAT(cl.nombre, ' ', cl.apellido) AS cliente,
              cl.telefono, cl.tipo_cliente, co.id_cliente
         FROM compras cm
        INNER JOIN cotizaciones co ON co.id_cotizacion = cm.id_cotizacion
        INNER JOIN clientes cl     ON cl.id_cliente    = co.id_cliente
        WHERE cm.id_compra = :idCompra`,
      { idCompra }
    );
    return rows[0] || null;
  },

  /** Productos de la compra con su plataforma. */
  async findDetalle(idCompra) {
    const [rows] = await pool.query(
      `SELECT cd.id_detalle_compra, cd.descripcion_producto,
              cd.numero_orden_plataforma, cd.tracking_tienda,
              cd.cantidad, cd.precio_unitario_usd, cd.impuesto_usd,
              cd.subtotal_usd, cd.peso_real_lb, cd.estado_producto,
              pl.id_plataforma, pl.nombre AS plataforma
         FROM compra_detalle cd
        INNER JOIN plataformas pl ON pl.id_plataforma = cd.id_plataforma
        WHERE cd.id_compra = :idCompra
        ORDER BY cd.id_detalle_compra`,
      { idCompra }
    );
    return rows;
  },

  /** Historial de pagos de la compra. */
  async findAbonos(idCompra) {
    const [rows] = await pool.query(
      `SELECT id_abono, fecha_abono, monto_hnl, metodo_pago,
              referencia, observaciones
         FROM abonos
        WHERE id_compra = :idCompra
        ORDER BY fecha_abono, id_abono`,
      { idCompra }
    );
    return rows;
  },

  /** Alta de compra vía sp_registrar_compra (copia detalle + anticipo como abono). */
  async create({ idCotizacion, costoProductosUsd, tasaCambio, anticipoHnl, metodoPago }) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `CALL sp_registrar_compra(:idCotizacion, :costoProductosUsd, :tasaCambio,
                                  :anticipoHnl, :metodoPago, @id_compra)`,
        {
          idCotizacion,
          costoProductosUsd,
          tasaCambio,
          anticipoHnl: anticipoHnl ?? 0,
          metodoPago: metodoPago ?? null,
        }
      );
      const [[{ id_compra }]] = await conn.query('SELECT @id_compra AS id_compra');
      return id_compra;
    } finally {
      conn.release();
    }
  },

  /**
   * Registra un abono. Los triggers de la BD hacen el resto:
   * validan el monto contra el saldo y actualizan el estado de cuenta.
   */
  async addAbono(idCompra, abono) {
    const [result] = await pool.query(
      `INSERT INTO abonos (id_compra, monto_hnl, metodo_pago, referencia, observaciones)
       VALUES (:idCompra, :monto, :metodoPago, :referencia, :observaciones)`,
      {
        idCompra,
        monto: abono.monto_hnl,
        metodoPago: abono.metodo_pago ?? 'Efectivo',
        referencia: abono.referencia ?? null,
        observaciones: abono.observaciones ?? null,
      }
    );
    return result.insertId;
  },

  /** Cambio de estado logístico de la compra. */
  async updateEstado(idCompra, estado) {
    const [result] = await pool.query(
      `UPDATE compras SET estado = :estado WHERE id_compra = :idCompra`,
      { idCompra, estado }
    );
    return result.affectedRows > 0;
  },

  /** Actualiza orden, tracking, peso real y estado de un producto comprado. */
  async updateDetalle(idDetalleCompra, datos) {
    const [result] = await pool.query(
      `UPDATE compra_detalle
          SET numero_orden_plataforma = COALESCE(:numeroOrden, numero_orden_plataforma),
              tracking_tienda         = COALESCE(:tracking, tracking_tienda),
              peso_real_lb            = COALESCE(:pesoReal, peso_real_lb),
              estado_producto         = COALESCE(:estadoProducto, estado_producto)
        WHERE id_detalle_compra = :idDetalleCompra`,
      {
        idDetalleCompra,
        numeroOrden: datos.numero_orden_plataforma ?? null,
        tracking: datos.tracking_tienda ?? null,
        pesoReal: datos.peso_real_lb ?? null,
        estadoProducto: datos.estado_producto ?? null,
      }
    );
    return result.affectedRows > 0;
  },

  async findDetalleById(idDetalleCompra) {
    const [rows] = await pool.query(
      `SELECT * FROM compra_detalle WHERE id_detalle_compra = :idDetalleCompra`,
      { idDetalleCompra }
    );
    return rows[0] || null;
  },

  /** Cuentas por cobrar desde la vista gerencial. */
  async findPendientesPago() {
    const [rows] = await pool.query('SELECT * FROM vw_compras_pendientes_pago');
    return rows;
  },
};

module.exports = comprasRepository;

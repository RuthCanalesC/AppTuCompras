/**
 * ============================================================
 * Repositorio de REPORTES (capa de acceso a datos)
 * ------------------------------------------------------------
 * Materializa el RF-12 (reportes gerenciales) apoyándose en las
 * vistas de la Fase 9 — la lógica de negocio pesada vive en la
 * base de datos; aquí solo se filtra y agrega.
 *   - vw_reporte_ganancias_totales  -> rentabilidad con prorrateo
 *   - vw_compras_pendientes_pago    -> cuentas por cobrar
 *   - vw_resumen_cotizaciones       -> pipeline comercial
 * ============================================================
 */
const { pool } = require('../../config/db');

const reportesRepository = {
  /**
   * KPIs del resumen ejecutivo (una fila por indicador, en paralelo).
   */
  async resumenEjecutivo() {
    const [
      [[clientes]],
      [[cotizaciones]],
      [[comprasActivas]],
      [[cuentasPorCobrar]],
      [[ganancias]],
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total,
                SUM(estado = 'Activo') AS activos
           FROM clientes`
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                SUM(estado = 'Pendiente') AS pendientes,
                SUM(estado = 'Enviada')   AS enviadas,
                SUM(estado = 'Aprobada')  AS aprobadas,
                SUM(estado = 'Rechazada') AS rechazadas,
                SUM(estado = 'Vencida')   AS vencidas
           FROM cotizaciones`
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                SUM(estado NOT IN ('Entregada','Cancelada')) AS en_proceso,
                SUM(estado = 'Entregada') AS entregadas
           FROM compras`
      ),
      pool.query(
        `SELECT COUNT(*) AS compras_con_saldo,
                IFNULL(SUM(saldo_pendiente_hnl), 0) AS saldo_total_hnl
           FROM compras
          WHERE saldo_pendiente_hnl > 0 AND estado <> 'Cancelada'`
      ),
      pool.query(
        `SELECT COUNT(*) AS pedidos_cerrados,
                IFNULL(SUM(ingreso_total_hnl), 0)  AS ingresos_hnl,
                IFNULL(SUM(ganancia_neta_hnl), 0)  AS ganancia_total_hnl,
                IFNULL(ROUND(AVG(margen_pct), 2), 0) AS margen_promedio_pct
           FROM entregas_ganancias`
      ),
    ]);

    return { clientes, cotizaciones, compras: comprasActivas, cuentasPorCobrar, ganancias };
  },

  /**
   * Detalle de ganancias por producto entregado (vista con prorrateo).
   * Filtros opcionales: rango de fechas de entrega, cliente y plataforma.
   */
  async ganancias({ desde, hasta, cliente, plataforma, limit = 100, offset = 0 } = {}) {
    const condiciones = [];
    const params = { limit: Number(limit), offset: Number(offset) };

    if (desde) {
      condiciones.push('fecha_entrega >= :desde');
      params.desde = desde;
    }
    if (hasta) {
      condiciones.push('fecha_entrega < DATE_ADD(:hasta, INTERVAL 1 DAY)');
      params.hasta = hasta;
    }
    if (cliente) {
      condiciones.push('cliente LIKE :cliente');
      params.cliente = `%${cliente}%`;
    }
    if (plataforma) {
      condiciones.push('plataforma = :plataforma');
      params.plataforma = plataforma;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT * FROM vw_reporte_ganancias_totales
       ${where}
       LIMIT :limit OFFSET :offset`,
      params
    );
    return rows;
  },

  /** Rentabilidad agregada por plataforma (sobre la vista de prorrateo). */
  async gananciasPorPlataforma() {
    const [rows] = await pool.query(
      `SELECT plataforma,
              COUNT(*)                                  AS productos_entregados,
              SUM(cantidad)                             AS unidades,
              ROUND(SUM(costo_producto_usd), 2)         AS costo_productos_usd,
              ROUND(SUM(ganancia_neta_producto_hnl), 2) AS ganancia_neta_hnl
         FROM vw_reporte_ganancias_totales
        GROUP BY plataforma
        ORDER BY ganancia_neta_hnl DESC`
    );
    return rows;
  },

  /** Rentabilidad agregada por cliente. */
  async gananciasPorCliente() {
    const [rows] = await pool.query(
      `SELECT cliente,
              COUNT(DISTINCT numero_compra)             AS pedidos_entregados,
              ROUND(MAX(ingreso_compra_hnl), 2)         AS ultimo_ingreso_hnl,
              ROUND(SUM(ganancia_neta_producto_hnl), 2) AS ganancia_neta_hnl,
              ROUND(AVG(margen_pct), 2)                 AS margen_promedio_pct
         FROM vw_reporte_ganancias_totales
        GROUP BY cliente
        ORDER BY ganancia_neta_hnl DESC`
    );
    return rows;
  },

  /** Pipeline comercial: cotizaciones agrupadas por estado con montos. */
  async pipelineCotizaciones() {
    const [rows] = await pool.query(
      `SELECT estado,
              COUNT(*)                          AS cotizaciones,
              ROUND(SUM(total_lempiras), 2)     AS monto_total_hnl
         FROM vw_resumen_cotizaciones
        GROUP BY estado
        ORDER BY FIELD(estado, 'Pendiente','Enviada','Aprobada','Rechazada','Vencida')`
    );
    return rows;
  },
};

module.exports = reportesRepository;

/**
 * ============================================================
 * Repositorio de ENVÍOS (capa de acceso a datos)
 * ------------------------------------------------------------
 * La tabla envios rompe la relación N:M compras ↔ casilleros:
 * una compra puede llegar en varios envíos y cada envío pasa
 * por exactamente un casillero (R5 del modelo lógico).
 * ============================================================
 */
const { pool } = require('../../config/db');

const enviosRepository = {
  async findAll({ idCompra, estado, limit = 50, offset = 0 } = {}) {
    const condiciones = [];
    const params = { limit: Number(limit), offset: Number(offset) };

    if (idCompra) {
      condiciones.push('e.id_compra = :idCompra');
      params.idCompra = Number(idCompra);
    }
    if (estado) {
      condiciones.push('e.estado = :estado');
      params.estado = estado;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT e.*, ca.nombre AS casillero, ca.pais AS pais_casillero,
              CONCAT(cl.nombre, ' ', cl.apellido) AS cliente
         FROM envios e
        INNER JOIN casilleros ca   ON ca.id_casillero  = e.id_casillero
        INNER JOIN compras cm      ON cm.id_compra     = e.id_compra
        INNER JOIN cotizaciones co ON co.id_cotizacion = cm.id_cotizacion
        INNER JOIN clientes cl     ON cl.id_cliente    = co.id_cliente
        ${where}
        ORDER BY e.id_envio DESC
        LIMIT :limit OFFSET :offset`,
      params
    );
    return rows;
  },

  async findById(idEnvio) {
    const [rows] = await pool.query(
      `SELECT e.*, ca.nombre AS casillero, ca.pais AS pais_casillero,
              CONCAT(cl.nombre, ' ', cl.apellido) AS cliente
         FROM envios e
        INNER JOIN casilleros ca   ON ca.id_casillero  = e.id_casillero
        INNER JOIN compras cm      ON cm.id_compra     = e.id_compra
        INNER JOIN cotizaciones co ON co.id_cotizacion = cm.id_cotizacion
        INNER JOIN clientes cl     ON cl.id_cliente    = co.id_cliente
        WHERE e.id_envio = :idEnvio`,
      { idEnvio }
    );
    return rows[0] || null;
  },

  async create(datos) {
    const [result] = await pool.query(
      `INSERT INTO envios (id_compra, id_casillero, guia_courier,
                           fecha_recepcion_casillero, peso_facturado_lb,
                           costo_flete_usd, impuestos_aduana_hnl)
       VALUES (:idCompra, :idCasillero, :guiaCourier,
               :fechaRecepcion, :pesoFacturado, :costoFlete, :impuestosAduana)`,
      {
        idCompra: datos.id_compra,
        idCasillero: datos.id_casillero,
        guiaCourier: datos.guia_courier ?? null,
        fechaRecepcion: datos.fecha_recepcion_casillero ?? null,
        pesoFacturado: datos.peso_facturado_lb ?? 0,
        costoFlete: datos.costo_flete_usd ?? 0,
        impuestosAduana: datos.impuestos_aduana_hnl ?? 0,
      }
    );
    return result.insertId;
  },

  async update(idEnvio, datos) {
    const [result] = await pool.query(
      `UPDATE envios
          SET guia_courier              = COALESCE(:guiaCourier, guia_courier),
              fecha_recepcion_casillero = COALESCE(:fechaRecepcion, fecha_recepcion_casillero),
              fecha_salida_origen       = COALESCE(:fechaSalida, fecha_salida_origen),
              fecha_llegada_hn          = COALESCE(:fechaLlegada, fecha_llegada_hn),
              peso_facturado_lb         = COALESCE(:pesoFacturado, peso_facturado_lb),
              costo_flete_usd           = COALESCE(:costoFlete, costo_flete_usd),
              impuestos_aduana_hnl      = COALESCE(:impuestosAduana, impuestos_aduana_hnl),
              estado                    = COALESCE(:estado, estado)
        WHERE id_envio = :idEnvio`,
      {
        idEnvio,
        guiaCourier: datos.guia_courier ?? null,
        fechaRecepcion: datos.fecha_recepcion_casillero ?? null,
        fechaSalida: datos.fecha_salida_origen ?? null,
        fechaLlegada: datos.fecha_llegada_hn ?? null,
        pesoFacturado: datos.peso_facturado_lb ?? null,
        costoFlete: datos.costo_flete_usd ?? null,
        impuestosAduana: datos.impuestos_aduana_hnl ?? null,
        estado: datos.estado ?? null,
      }
    );
    return result.affectedRows > 0;
  },
};

module.exports = enviosRepository;

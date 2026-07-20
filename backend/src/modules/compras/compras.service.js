/**
 * ============================================================
 * Servicio de COMPRAS y ABONOS (capa de lógica de negocio)
 * ------------------------------------------------------------
 * Reglas aplicadas:
 *  - RN-02: solo cotizaciones Aprobadas generan compra, y solo una
 *           (lo refuerza el SP; aquí se traduce el error a HTTP).
 *  - RN-03: el anticipo/abono nunca supera el saldo (trigger BI).
 *  - RN-04: el saldo SOLO lo mueven los abonos (trigger AI) — este
 *           servicio jamás escribe saldo_pendiente_hnl directamente.
 *  - Máquina de estados logística:
 *      Comprada -> En_Casillero -> En_Transito -> En_Aduana -> Recibida_HN
 *      "Entregada" NO se asigna aquí: la asigna sp_procesar_entrega
 *      (módulo de entregas). "Cancelada" solo desde Comprada.
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const comprasRepository = require('./compras.repository');

const ESTADOS = ['Comprada', 'En_Casillero', 'En_Transito', 'En_Aduana',
  'Recibida_HN', 'Entregada', 'Cancelada'];

/** Transiciones logísticas permitidas vía API. */
const TRANSICIONES = {
  Comprada: ['En_Casillero', 'Cancelada'],
  En_Casillero: ['En_Transito'],
  En_Transito: ['En_Aduana'],
  En_Aduana: ['Recibida_HN'],
  Recibida_HN: [],   // "Entregada" la asigna sp_procesar_entrega (módulo 5)
  Entregada: [],     // estado final
  Cancelada: [],     // estado final
};

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Deposito', 'Billetera_Digital'];
const ESTADOS_PRODUCTO = ['Ordenado', 'Recibido_Casillero', 'En_Transito',
  'Recibido_HN', 'Entregado', 'Devuelto'];

const comprasService = {
  async listar(filtros) {
    if (filtros.estado && !ESTADOS.includes(filtros.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS.join(', ')}`);
    }
    return comprasRepository.findAll({
      estado: filtros.estado,
      conSaldo: filtros.con_saldo,
      limit: filtros.limit,
      offset: filtros.offset,
    });
  },

  /** Compra completa: cabecera + productos + historial de abonos. */
  async obtenerPorId(id) {
    const idCompra = Number(id);
    if (!Number.isInteger(idCompra) || idCompra <= 0) {
      throw ApiError.badRequest('El ID de la compra debe ser un número entero positivo.');
    }
    const cabecera = await comprasRepository.findById(idCompra);
    if (!cabecera) {
      throw ApiError.notFound(`No existe una compra con ID ${idCompra}.`);
    }
    const [detalle, abonos] = await Promise.all([
      comprasRepository.findDetalle(idCompra),
      comprasRepository.findAbonos(idCompra),
    ]);
    return { ...cabecera, detalle, abonos };
  },

  /** Registra la compra de una cotización Aprobada (RN-02 vía SP). */
  async registrar(datos) {
    const idCotizacion = Number(datos.id_cotizacion);
    if (!Number.isInteger(idCotizacion) || idCotizacion <= 0) {
      throw ApiError.badRequest('El campo "id_cotizacion" es obligatorio y debe ser un entero positivo.');
    }
    const costo = Number(datos.costo_productos_usd);
    if (Number.isNaN(costo) || costo < 0) {
      throw ApiError.badRequest('El campo "costo_productos_usd" es obligatorio y debe ser >= 0.');
    }
    const tasa = Number(datos.tasa_cambio);
    if (Number.isNaN(tasa) || tasa <= 0) {
      throw ApiError.badRequest('El campo "tasa_cambio" es obligatorio y debe ser mayor que cero.');
    }
    if (datos.anticipo_hnl !== undefined) {
      const anticipo = Number(datos.anticipo_hnl);
      if (Number.isNaN(anticipo) || anticipo < 0) {
        throw ApiError.badRequest('El campo "anticipo_hnl" debe ser un número >= 0.');
      }
    }
    if (datos.metodo_pago && !METODOS_PAGO.includes(datos.metodo_pago)) {
      throw ApiError.badRequest(`Método de pago inválido. Use: ${METODOS_PAGO.join(', ')}`);
    }

    try {
      const idCompra = await comprasRepository.create({
        idCotizacion,
        costoProductosUsd: costo,
        tasaCambio: tasa,
        anticipoHnl: datos.anticipo_hnl,
        metodoPago: datos.metodo_pago,
      });
      return this.obtenerPorId(idCompra);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  /** Registra un abono; los triggers validan y actualizan el saldo (RN-03/RN-04). */
  async abonar(id, abono) {
    const compra = await this.obtenerPorId(id);

    if (['Entregada', 'Cancelada'].includes(compra.estado)) {
      throw ApiError.conflict(`No se pueden registrar abonos en una compra ${compra.estado.toLowerCase()}.`);
    }
    const monto = Number(abono.monto_hnl);
    if (Number.isNaN(monto) || monto <= 0) {
      throw ApiError.badRequest('El campo "monto_hnl" es obligatorio y debe ser mayor que cero.');
    }
    if (abono.metodo_pago && !METODOS_PAGO.includes(abono.metodo_pago)) {
      throw ApiError.badRequest(`Método de pago inválido. Use: ${METODOS_PAGO.join(', ')}`);
    }

    try {
      await comprasRepository.addAbono(compra.id_compra, { ...abono, monto_hnl: monto });
      return this.obtenerPorId(compra.id_compra);
    } catch (err) {
      throw ApiError.fromDbError(err); // trigger BI: "El abono excede el saldo..."
    }
  },

  /** Estado de cuenta: total, abonado, saldo y % pagado, con historial. */
  async estadoCuenta(id) {
    const compra = await this.obtenerPorId(id);
    const totalAbonado = compra.abonos.reduce((suma, a) => suma + Number(a.monto_hnl), 0);
    return {
      id_compra: compra.id_compra,
      cliente: compra.cliente,
      telefono: compra.telefono,
      fecha_compra: compra.fecha_compra,
      estado_logistico: compra.estado,
      total_cliente_hnl: compra.total_cliente_hnl,
      total_abonado_hnl: Number(totalAbonado.toFixed(2)),
      saldo_pendiente_hnl: compra.saldo_pendiente_hnl,
      pct_pagado: compra.total_cliente_hnl > 0
        ? Number(((totalAbonado / compra.total_cliente_hnl) * 100).toFixed(2))
        : 0,
      abonos: compra.abonos,
    };
  },

  /** Cuentas por cobrar (vista gerencial vw_compras_pendientes_pago). */
  async pendientesPago() {
    return comprasRepository.findPendientesPago();
  },

  /** Cambio de estado logístico validando la máquina de estados. */
  async cambiarEstado(id, nuevoEstado) {
    if (!nuevoEstado || !ESTADOS.includes(nuevoEstado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS.join(', ')}`);
    }
    if (nuevoEstado === 'Entregada') {
      throw ApiError.conflict(
        'El estado "Entregada" no se asigna manualmente: se genera al procesar la entrega (módulo de entregas), que exige saldo en cero.'
      );
    }
    const compra = await this.obtenerPorId(id);

    const permitidos = TRANSICIONES[compra.estado] || [];
    if (!permitidos.includes(nuevoEstado)) {
      throw ApiError.conflict(
        `Transición no permitida: ${compra.estado} -> ${nuevoEstado}. ` +
        (permitidos.length
          ? `Desde "${compra.estado}" solo puede pasar a: ${permitidos.join(', ')}.`
          : `"${compra.estado}" es un estado final o cierra por otro módulo.`)
      );
    }

    try {
      await comprasRepository.updateEstado(compra.id_compra, nuevoEstado);
      return this.obtenerPorId(compra.id_compra);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  /** Actualiza orden/tracking/peso/estado de un producto de la compra. */
  async actualizarDetalle(idCompra, idDetalle, datos) {
    const compra = await this.obtenerPorId(idCompra);

    const idDetalleCompra = Number(idDetalle);
    const linea = await comprasRepository.findDetalleById(idDetalleCompra);
    if (!linea || linea.id_compra !== compra.id_compra) {
      throw ApiError.notFound(`El producto ${idDetalle} no pertenece a la compra ${compra.id_compra}.`);
    }
    if (datos.estado_producto && !ESTADOS_PRODUCTO.includes(datos.estado_producto)) {
      throw ApiError.badRequest(`Estado de producto inválido. Use: ${ESTADOS_PRODUCTO.join(', ')}`);
    }
    if (datos.peso_real_lb !== undefined) {
      const peso = Number(datos.peso_real_lb);
      if (Number.isNaN(peso) || peso < 0) {
        throw ApiError.badRequest('El campo "peso_real_lb" debe ser un número >= 0.');
      }
    }

    try {
      await comprasRepository.updateDetalle(idDetalleCompra, datos);
      return this.obtenerPorId(compra.id_compra);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },
};

module.exports = comprasService;

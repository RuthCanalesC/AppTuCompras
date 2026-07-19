/**
 * ============================================================
 * Servicio de COTIZACIONES (capa de lógica de negocio)
 * ------------------------------------------------------------
 * Reglas aplicadas:
 *  - RN-01: cliente inactivo no cotiza (validado también por el SP).
 *  - Máquina de estados: Pendiente -> Enviada -> Aprobada/Rechazada/Vencida.
 *    Los estados finales no pueden cambiarse.
 *  - El detalle solo se agrega en Pendiente/Enviada (lo refuerza el SP).
 *  - La tarifa por libra para el envío estimado se obtiene del
 *    CASILLERO previsto (el operador manda id_casillero, no la tarifa
 *    a mano — así no hay errores de digitación).
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const cotizacionesRepository = require('./cotizaciones.repository');
const casillerosRepository = require('../casilleros/casilleros.repository');

const ESTADOS = ['Pendiente', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida'];

/** Transiciones de estado permitidas (máquina de estados). */
const TRANSICIONES = {
  Pendiente: ['Enviada', 'Aprobada', 'Rechazada', 'Vencida'],
  Enviada: ['Aprobada', 'Rechazada', 'Vencida'],
  Aprobada: [],   // estado final: de aquí solo nace la compra
  Rechazada: [],  // estado final
  Vencida: [],    // estado final
};

const cotizacionesService = {
  async listar(filtros) {
    if (filtros.estado && !ESTADOS.includes(filtros.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS.join(', ')}`);
    }
    return cotizacionesRepository.findAll({
      estado: filtros.estado,
      idCliente: filtros.cliente,
      limit: filtros.limit,
      offset: filtros.offset,
    });
  },

  /** Cabecera + líneas de detalle en una sola respuesta. */
  async obtenerPorId(id) {
    const idCotizacion = Number(id);
    if (!Number.isInteger(idCotizacion) || idCotizacion <= 0) {
      throw ApiError.badRequest('El ID de la cotización debe ser un número entero positivo.');
    }
    const cabecera = await cotizacionesRepository.findById(idCotizacion);
    if (!cabecera) {
      throw ApiError.notFound(`No existe una cotización con ID ${idCotizacion}.`);
    }
    const detalle = await cotizacionesRepository.findDetalle(idCotizacion);
    return { ...cabecera, detalle };
  },

  async crear(datos) {
    const idCliente = Number(datos.id_cliente);
    if (!Number.isInteger(idCliente) || idCliente <= 0) {
      throw ApiError.badRequest('El campo "id_cliente" es obligatorio y debe ser un entero positivo.');
    }
    const tasa = Number(datos.tasa_cambio);
    if (Number.isNaN(tasa) || tasa <= 0) {
      throw ApiError.badRequest('El campo "tasa_cambio" es obligatorio y debe ser mayor que cero.');
    }
    if (datos.dias_vigencia !== undefined) {
      const dias = Number(datos.dias_vigencia);
      if (!Number.isInteger(dias) || dias <= 0) {
        throw ApiError.badRequest('El campo "dias_vigencia" debe ser un entero positivo.');
      }
    }

    try {
      const idCotizacion = await cotizacionesRepository.create({
        idCliente,
        tasaCambio: tasa,
        diasVigencia: datos.dias_vigencia,
        observaciones: datos.observaciones,
      });
      return this.obtenerPorId(idCotizacion);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  /**
   * Agrega un producto. La tarifa por libra sale del casillero previsto:
   * el cliente del API manda id_casillero y aquí se resuelve su tarifa.
   */
  async agregarDetalle(id, linea) {
    const cotizacion = await this.obtenerPorId(id); // valida existencia

    if (!linea.descripcion_producto || String(linea.descripcion_producto).trim() === '') {
      throw ApiError.badRequest('El campo "descripcion_producto" es obligatorio.');
    }
    const idPlataforma = Number(linea.id_plataforma);
    if (!Number.isInteger(idPlataforma) || idPlataforma <= 0) {
      throw ApiError.badRequest('El campo "id_plataforma" es obligatorio y debe ser un entero positivo.');
    }
    const precio = Number(linea.precio_unitario_usd);
    if (Number.isNaN(precio) || precio < 0) {
      throw ApiError.badRequest('El campo "precio_unitario_usd" es obligatorio y debe ser >= 0.');
    }
    if (linea.cantidad !== undefined) {
      const cantidad = Number(linea.cantidad);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw ApiError.badRequest('El campo "cantidad" debe ser un entero mayor que cero.');
      }
    }

    // Resolver la tarifa por libra desde el casillero previsto
    const idCasillero = Number(linea.id_casillero);
    if (!Number.isInteger(idCasillero) || idCasillero <= 0) {
      throw ApiError.badRequest('El campo "id_casillero" es obligatorio (casillero previsto para el envío).');
    }
    const casillero = await casillerosRepository.findById(idCasillero);
    if (!casillero) {
      throw ApiError.notFound(`No existe un casillero con ID ${idCasillero}.`);
    }
    if (casillero.estado !== 'Activo') {
      throw ApiError.badRequest(`El casillero "${casillero.nombre}" no está activo.`);
    }

    try {
      await cotizacionesRepository.addDetalle(cotizacion.id_cotizacion, {
        ...linea,
        id_plataforma: idPlataforma,
        precio_unitario_usd: precio,
        costo_libra_usd: casillero.costo_por_libra_usd,
      });
      // Devuelve la cotización con los totales ya recalculados por el SP
      return this.obtenerPorId(cotizacion.id_cotizacion);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  /** Cambio de estado validando la máquina de estados. */
  async cambiarEstado(id, nuevoEstado) {
    if (!nuevoEstado || !ESTADOS.includes(nuevoEstado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS.join(', ')}`);
    }
    const cotizacion = await this.obtenerPorId(id);

    const permitidos = TRANSICIONES[cotizacion.estado] || [];
    if (!permitidos.includes(nuevoEstado)) {
      throw ApiError.conflict(
        `Transición no permitida: ${cotizacion.estado} -> ${nuevoEstado}. ` +
        (permitidos.length
          ? `Desde "${cotizacion.estado}" solo puede pasar a: ${permitidos.join(', ')}.`
          : `"${cotizacion.estado}" es un estado final.`)
      );
    }

    // Regla adicional: no se puede aprobar una cotización sin productos
    if (nuevoEstado === 'Aprobada' && cotizacion.detalle.length === 0) {
      throw ApiError.badRequest('No se puede aprobar una cotización sin productos.');
    }

    try {
      await cotizacionesRepository.updateEstado(cotizacion.id_cotizacion, nuevoEstado);
      return this.obtenerPorId(cotizacion.id_cotizacion);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },
};

module.exports = cotizacionesService;

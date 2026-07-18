/**
 * ============================================================
 * Servicio de CASILLEROS (lógica de negocio del catálogo logístico)
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const casillerosRepository = require('./casilleros.repository');

const ESTADOS_VALIDOS = ['Activo', 'Inactivo', 'En_Apertura'];

const casillerosService = {
  async listar(filtros) {
    if (filtros.estado && !ESTADOS_VALIDOS.includes(filtros.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }
    return casillerosRepository.findAll(filtros);
  },

  async obtenerPorId(id) {
    const idCasillero = Number(id);
    if (!Number.isInteger(idCasillero) || idCasillero <= 0) {
      throw ApiError.badRequest('El ID del casillero debe ser un número entero positivo.');
    }
    const casillero = await casillerosRepository.findById(idCasillero);
    if (!casillero) {
      throw ApiError.notFound(`No existe un casillero con ID ${idCasillero}.`);
    }
    return casillero;
  },

  async crear(datos) {
    const obligatorios = ['nombre', 'pais', 'ciudad', 'direccion', 'costo_por_libra_usd'];
    for (const campo of obligatorios) {
      if (datos[campo] === undefined || String(datos[campo]).trim() === '') {
        throw ApiError.badRequest(`El campo "${campo}" es obligatorio.`);
      }
    }
    const costo = Number(datos.costo_por_libra_usd);
    if (Number.isNaN(costo) || costo < 0) {
      throw ApiError.badRequest('El costo por libra debe ser un número mayor o igual a 0.');
    }
    if (datos.estado && !ESTADOS_VALIDOS.includes(datos.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    try {
      const id = await casillerosRepository.create(datos);
      return casillerosRepository.findById(id);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  async actualizar(id, datos) {
    const casillero = await this.obtenerPorId(id);
    if (datos.costo_por_libra_usd !== undefined) {
      const costo = Number(datos.costo_por_libra_usd);
      if (Number.isNaN(costo) || costo < 0) {
        throw ApiError.badRequest('El costo por libra debe ser un número mayor o igual a 0.');
      }
    }
    if (datos.estado && !ESTADOS_VALIDOS.includes(datos.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    try {
      await casillerosRepository.update(casillero.id_casillero, datos);
      return casillerosRepository.findById(casillero.id_casillero);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },
};

module.exports = casillerosService;

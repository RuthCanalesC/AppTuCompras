/**
 * ============================================================
 * Servicio de PLATAFORMAS (lógica de negocio del catálogo)
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const plataformasRepository = require('./plataformas.repository');

const ESTADOS_VALIDOS = ['Activa', 'Inactiva'];

function validarComision(comision) {
  const valor = Number(comision);
  if (Number.isNaN(valor) || valor < 0 || valor > 100) {
    throw ApiError.badRequest('La comisión debe ser un porcentaje entre 0 y 100.');
  }
  return valor;
}

const plataformasService = {
  async listar(filtros) {
    if (filtros.estado && !ESTADOS_VALIDOS.includes(filtros.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }
    return plataformasRepository.findAll(filtros);
  },

  async obtenerPorId(id) {
    const idPlataforma = Number(id);
    if (!Number.isInteger(idPlataforma) || idPlataforma <= 0) {
      throw ApiError.badRequest('El ID de la plataforma debe ser un número entero positivo.');
    }
    const plataforma = await plataformasRepository.findById(idPlataforma);
    if (!plataforma) {
      throw ApiError.notFound(`No existe una plataforma con ID ${idPlataforma}.`);
    }
    return plataforma;
  },

  async crear(datos) {
    if (!datos.nombre || String(datos.nombre).trim() === '') {
      throw ApiError.badRequest('El nombre de la plataforma es obligatorio.');
    }
    if (datos.comision_pct !== undefined) validarComision(datos.comision_pct);

    try {
      const id = await plataformasRepository.create(datos);
      return plataformasRepository.findById(id);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  async actualizar(id, datos) {
    const plataforma = await this.obtenerPorId(id);
    if (datos.comision_pct !== undefined) validarComision(datos.comision_pct);
    if (datos.estado && !ESTADOS_VALIDOS.includes(datos.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    try {
      await plataformasRepository.update(plataforma.id_plataforma, datos);
      return plataformasRepository.findById(plataforma.id_plataforma);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },
};

module.exports = plataformasService;

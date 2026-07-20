/**
 * ============================================================
 * Servicio de ENVÍOS (capa de lógica de negocio)
 * ------------------------------------------------------------
 * Reglas aplicadas:
 *  - Solo se crean envíos para compras vivas (no Entregada/Cancelada).
 *  - El casillero debe existir y estar Activo.
 *  - Máquina de estados del envío (Etapas 5 y 6 del negocio):
 *      En_Casillero -> En_Transito -> En_Aduana -> Recibido_HN
 *  - Los costos reales (flete USD, aduana HNL) registrados aquí son
 *    los que sp_procesar_entrega suma al cierre de ganancias.
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const enviosRepository = require('./envios.repository');
const comprasRepository = require('../compras/compras.repository');
const casillerosRepository = require('../casilleros/casilleros.repository');

const ESTADOS = ['En_Casillero', 'En_Transito', 'En_Aduana', 'Recibido_HN'];

const TRANSICIONES = {
  En_Casillero: ['En_Transito'],
  En_Transito: ['En_Aduana'],
  En_Aduana: ['Recibido_HN'],
  Recibido_HN: [], // estado final del envío
};

function validarMontos(datos) {
  for (const campo of ['peso_facturado_lb', 'costo_flete_usd', 'impuestos_aduana_hnl']) {
    if (datos[campo] !== undefined) {
      const valor = Number(datos[campo]);
      if (Number.isNaN(valor) || valor < 0) {
        throw ApiError.badRequest(`El campo "${campo}" debe ser un número >= 0.`);
      }
    }
  }
}

const enviosService = {
  async listar(filtros) {
    if (filtros.estado && !ESTADOS.includes(filtros.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS.join(', ')}`);
    }
    return enviosRepository.findAll({
      idCompra: filtros.compra,
      estado: filtros.estado,
      limit: filtros.limit,
      offset: filtros.offset,
    });
  },

  async obtenerPorId(id) {
    const idEnvio = Number(id);
    if (!Number.isInteger(idEnvio) || idEnvio <= 0) {
      throw ApiError.badRequest('El ID del envío debe ser un número entero positivo.');
    }
    const envio = await enviosRepository.findById(idEnvio);
    if (!envio) {
      throw ApiError.notFound(`No existe un envío con ID ${idEnvio}.`);
    }
    return envio;
  },

  async crear(datos) {
    const idCompra = Number(datos.id_compra);
    if (!Number.isInteger(idCompra) || idCompra <= 0) {
      throw ApiError.badRequest('El campo "id_compra" es obligatorio y debe ser un entero positivo.');
    }
    const idCasillero = Number(datos.id_casillero);
    if (!Number.isInteger(idCasillero) || idCasillero <= 0) {
      throw ApiError.badRequest('El campo "id_casillero" es obligatorio y debe ser un entero positivo.');
    }

    // La compra debe existir y estar viva
    const compra = await comprasRepository.findById(idCompra);
    if (!compra) {
      throw ApiError.notFound(`No existe una compra con ID ${idCompra}.`);
    }
    if (['Entregada', 'Cancelada'].includes(compra.estado)) {
      throw ApiError.conflict(`No se pueden crear envíos para una compra ${compra.estado.toLowerCase()}.`);
    }

    // El casillero debe existir y estar activo
    const casillero = await casillerosRepository.findById(idCasillero);
    if (!casillero) {
      throw ApiError.notFound(`No existe un casillero con ID ${idCasillero}.`);
    }
    if (casillero.estado !== 'Activo') {
      throw ApiError.badRequest(`El casillero "${casillero.nombre}" no está activo.`);
    }

    validarMontos(datos);

    try {
      const idEnvio = await enviosRepository.create({
        ...datos,
        id_compra: idCompra,
        id_casillero: idCasillero,
      });
      return this.obtenerPorId(idEnvio);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  /**
   * Actualiza datos operativos del envío. Si viene "estado", se valida
   * la máquina de estados. Al llegar a Recibido_HN conviene también
   * registrar fecha_llegada_hn y los impuestos de aduana definitivos.
   */
  async actualizar(id, datos) {
    const envio = await this.obtenerPorId(id);

    validarMontos(datos);

    if (datos.estado) {
      if (!ESTADOS.includes(datos.estado)) {
        throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS.join(', ')}`);
      }
      const permitidos = TRANSICIONES[envio.estado] || [];
      if (!permitidos.includes(datos.estado)) {
        throw ApiError.conflict(
          `Transición no permitida: ${envio.estado} -> ${datos.estado}. ` +
          (permitidos.length
            ? `Desde "${envio.estado}" solo puede pasar a: ${permitidos.join(', ')}.`
            : `"${envio.estado}" es un estado final.`)
        );
      }
    }

    try {
      await enviosRepository.update(envio.id_envio, datos);
      return this.obtenerPorId(envio.id_envio);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },
};

module.exports = enviosService;

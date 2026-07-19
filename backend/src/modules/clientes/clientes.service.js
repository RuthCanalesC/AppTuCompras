/**
 * ============================================================
 * Servicio de CLIENTES (capa de lógica de negocio)
 * ------------------------------------------------------------
 * Valida las entradas ANTES de tocar la base de datos y aplica
 * las reglas de negocio del lado de la aplicación. El repositorio
 * solo ejecuta SQL; el controlador solo maneja HTTP.
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const clientesRepository = require('./clientes.repository');

const TIPOS_VALIDOS = ['Personal', 'Business', 'Express', 'Global'];
const ESTADOS_VALIDOS = ['Activo', 'Inactivo'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clientesService = {
  async listar(filtros) {
    if (filtros.estado && !ESTADOS_VALIDOS.includes(filtros.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }
    if (filtros.tipo && !TIPOS_VALIDOS.includes(filtros.tipo)) {
      throw ApiError.badRequest(`Tipo de cliente inválido. Use: ${TIPOS_VALIDOS.join(', ')}`);
    }
    return clientesRepository.findAll(filtros);
  },

  async obtenerPorId(id) {
    const idCliente = Number(id);
    if (!Number.isInteger(idCliente) || idCliente <= 0) {
      throw ApiError.badRequest('El ID del cliente debe ser un número entero positivo.');
    }
    const cliente = await clientesRepository.findById(idCliente);
    if (!cliente) {
      throw ApiError.notFound(`No existe un cliente con ID ${idCliente}.`);
    }
    return cliente;
  },

  async registrar(datos) {
    // Validaciones de entrada (la BD las repite: defensa en profundidad)
    const obligatorios = ['nombre', 'apellido', 'identidad', 'telefono'];
    for (const campo of obligatorios) {
      if (!datos[campo] || String(datos[campo]).trim() === '') {
        throw ApiError.badRequest(`El campo "${campo}" es obligatorio.`);
      }
    }
    if (datos.email && !EMAIL_REGEX.test(datos.email)) {
      throw ApiError.badRequest('El formato del correo electrónico no es válido.');
    }
    if (datos.tipo_cliente && !TIPOS_VALIDOS.includes(datos.tipo_cliente)) {
      throw ApiError.badRequest(`Tipo de cliente inválido. Use: ${TIPOS_VALIDOS.join(', ')}`);
    }

    try {
      const idCliente = await clientesRepository.create(datos);
      return clientesRepository.findById(idCliente);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },

  async actualizar(id, datos) {
    const cliente = await this.obtenerPorId(id); // valida existencia

    if (datos.email && !EMAIL_REGEX.test(datos.email)) {
      throw ApiError.badRequest('El formato del correo electrónico no es válido.');
    }
    if (datos.tipo_cliente && !TIPOS_VALIDOS.includes(datos.tipo_cliente)) {
      throw ApiError.badRequest(`Tipo de cliente inválido. Use: ${TIPOS_VALIDOS.join(', ')}`);
    }
    if (datos.estado && !ESTADOS_VALIDOS.includes(datos.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS_VALIDOS.join(', ')}`);
    }

    try {
      await clientesRepository.update(cliente.id_cliente, datos);
      return clientesRepository.findById(cliente.id_cliente);
    } catch (err) {
      throw ApiError.fromDbError(err);
    }
  },
};

module.exports = clientesService;

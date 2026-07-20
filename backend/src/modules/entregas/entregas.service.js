/**
 * ============================================================
 * Servicio de ENTREGAS (capa de lógica de negocio)
 * ------------------------------------------------------------
 * Reglas aplicadas (todas reforzadas por sp_procesar_entrega):
 *  - La compra debe estar Recibida_HN y no haber sido entregada.
 *  - RN-05: no existe entrega con saldo mayor que cero. Si el
 *    cliente paga contra entrega, se manda monto_liquidacion_hnl
 *    y el SP lo registra como abono final antes de validar.
 *  - Al entregar, el SP cierra la compra (Entregada), marca los
 *    productos y genera el cierre financiero automático en
 *    entregas_ganancias (Etapa 8 del negocio).
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const entregasRepository = require('./entregas.repository');

const ESTADOS = ['Programada', 'En_Ruta', 'Entregada', 'Fallida'];
const METODOS_ENTREGA = ['Domicilio', 'Punto_Entrega', 'Oficina'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Deposito', 'Billetera_Digital'];

const entregasService = {
  async listar(filtros) {
    if (filtros.estado && !ESTADOS.includes(filtros.estado)) {
      throw ApiError.badRequest(`Estado inválido. Use: ${ESTADOS.join(', ')}`);
    }
    return entregasRepository.findAll({
      estado: filtros.estado,
      limit: filtros.limit,
      offset: filtros.offset,
    });
  },

  async obtenerPorId(id) {
    const idEntrega = Number(id);
    if (!Number.isInteger(idEntrega) || idEntrega <= 0) {
      throw ApiError.badRequest('El ID de la entrega debe ser un número entero positivo.');
    }
    const entrega = await entregasRepository.findById(idEntrega);
    if (!entrega) {
      throw ApiError.notFound(`No existe una entrega con ID ${idEntrega}.`);
    }
    return entrega;
  },

  /**
   * Procesa la entrega final. Si el cliente paga contra entrega,
   * enviar monto_liquidacion_hnl > 0; el SP lo aplica como abono
   * y luego exige saldo en cero (RN-05).
   */
  async procesar(datos) {
    const idCompra = Number(datos.id_compra);
    if (!Number.isInteger(idCompra) || idCompra <= 0) {
      throw ApiError.badRequest('El campo "id_compra" es obligatorio y debe ser un entero positivo.');
    }
    if (!datos.direccion_entrega || String(datos.direccion_entrega).trim() === '') {
      throw ApiError.badRequest('El campo "direccion_entrega" es obligatorio.');
    }
    if (datos.metodo_entrega && !METODOS_ENTREGA.includes(datos.metodo_entrega)) {
      throw ApiError.badRequest(`Método de entrega inválido. Use: ${METODOS_ENTREGA.join(', ')}`);
    }
    if (datos.metodo_pago && !METODOS_PAGO.includes(datos.metodo_pago)) {
      throw ApiError.badRequest(`Método de pago inválido. Use: ${METODOS_PAGO.join(', ')}`);
    }
    for (const campo of ['costo_entrega_local_hnl', 'monto_liquidacion_hnl']) {
      if (datos[campo] !== undefined) {
        const valor = Number(datos[campo]);
        if (Number.isNaN(valor) || valor < 0) {
          throw ApiError.badRequest(`El campo "${campo}" debe ser un número >= 0.`);
        }
      }
    }

    try {
      const idEntrega = await entregasRepository.create({ ...datos, id_compra: idCompra });
      return this.obtenerPorId(idEntrega);
    } catch (err) {
      // El SP responde con mensajes claros:
      //  - "La compra aún no ha sido recibida en Honduras."
      //  - "No se puede entregar con saldo pendiente..."
      //  - "Esta compra ya fue entregada."
      throw ApiError.fromDbError(err);
    }
  },
};

module.exports = entregasService;

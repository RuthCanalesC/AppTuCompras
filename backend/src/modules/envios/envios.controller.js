/**
 * ============================================================
 * Controlador de ENVÍOS (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const enviosService = require('./envios.service');

const enviosController = {
  // GET /api/envios?compra=1&estado=En_Transito
  listar: asyncHandler(async (req, res) => {
    const envios = await enviosService.listar(req.query);
    res.json({ ok: true, total: envios.length, datos: envios });
  }),

  // GET /api/envios/:id
  obtener: asyncHandler(async (req, res) => {
    const envio = await enviosService.obtenerPorId(req.params.id);
    res.json({ ok: true, datos: envio });
  }),

  // POST /api/envios
  // { id_compra, id_casillero, guia_courier?, fecha_recepcion_casillero?,
  //   peso_facturado_lb?, costo_flete_usd?, impuestos_aduana_hnl? }
  crear: asyncHandler(async (req, res) => {
    const envio = await enviosService.crear(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Envío registrado.',
      datos: envio,
    });
  }),

  // PATCH /api/envios/:id
  // { guia_courier?, fecha_salida_origen?, fecha_llegada_hn?,
  //   peso_facturado_lb?, costo_flete_usd?, impuestos_aduana_hnl?, estado? }
  actualizar: asyncHandler(async (req, res) => {
    const envio = await enviosService.actualizar(req.params.id, req.body);
    res.json({
      ok: true,
      mensaje: `Envío actualizado (estado: ${envio.estado}).`,
      datos: envio,
    });
  }),
};

module.exports = enviosController;

/**
 * ============================================================
 * Controlador de ENTREGAS (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const entregasService = require('./entregas.service');

const entregasController = {
  // GET /api/entregas?estado=Entregada
  listar: asyncHandler(async (req, res) => {
    const entregas = await entregasService.listar(req.query);
    res.json({ ok: true, total: entregas.length, datos: entregas });
  }),

  // GET /api/entregas/:id  (incluye el cierre financiero)
  obtener: asyncHandler(async (req, res) => {
    const entrega = await entregasService.obtenerPorId(req.params.id);
    res.json({ ok: true, datos: entrega });
  }),

  // POST /api/entregas
  // { id_compra, direccion_entrega, ciudad?, metodo_entrega?,
  //   costo_entrega_local_hnl?, recibido_por?,
  //   monto_liquidacion_hnl?, metodo_pago? }
  procesar: asyncHandler(async (req, res) => {
    const entrega = await entregasService.procesar(req.body);
    const cierre = entrega.cierre_financiero;
    res.status(201).json({
      ok: true,
      mensaje: cierre
        ? `Entrega procesada. Resultado: ${cierre.ganancia_neta_hnl >= 0 ? 'GANANCIA' : 'PÉRDIDA'} de L ${Math.abs(cierre.ganancia_neta_hnl)} (margen ${cierre.margen_pct}%).`
        : 'Entrega procesada.',
      datos: entrega,
    });
  }),
};

module.exports = entregasController;

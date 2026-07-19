/**
 * ============================================================
 * Controlador de COTIZACIONES (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const cotizacionesService = require('./cotizaciones.service');

const cotizacionesController = {
  // GET /api/cotizaciones?estado=Pendiente&cliente=1
  listar: asyncHandler(async (req, res) => {
    const cotizaciones = await cotizacionesService.listar(req.query);
    res.json({ ok: true, total: cotizaciones.length, datos: cotizaciones });
  }),

  // GET /api/cotizaciones/:id  (cabecera + detalle)
  obtener: asyncHandler(async (req, res) => {
    const cotizacion = await cotizacionesService.obtenerPorId(req.params.id);
    res.json({ ok: true, datos: cotizacion });
  }),

  // POST /api/cotizaciones  { id_cliente, tasa_cambio, dias_vigencia?, observaciones? }
  crear: asyncHandler(async (req, res) => {
    const cotizacion = await cotizacionesService.crear(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Cotización creada correctamente.',
      datos: cotizacion,
    });
  }),

  // POST /api/cotizaciones/:id/detalle
  // { id_plataforma, id_casillero, descripcion_producto, url_producto?,
  //   cantidad?, precio_unitario_usd, peso_estimado_lb? }
  agregarDetalle: asyncHandler(async (req, res) => {
    const cotizacion = await cotizacionesService.agregarDetalle(req.params.id, req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Producto agregado; totales recalculados.',
      datos: cotizacion,
    });
  }),

  // PATCH /api/cotizaciones/:id/estado  { estado: "Aprobada" }
  cambiarEstado: asyncHandler(async (req, res) => {
    const cotizacion = await cotizacionesService.cambiarEstado(req.params.id, req.body.estado);
    res.json({
      ok: true,
      mensaje: `Cotización ${cotizacion.estado.toLowerCase()}.`,
      datos: cotizacion,
    });
  }),
};

module.exports = cotizacionesController;

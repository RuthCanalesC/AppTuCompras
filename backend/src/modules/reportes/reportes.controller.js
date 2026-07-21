/**
 * ============================================================
 * Controlador de REPORTES (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const reportesService = require('./reportes.service');

const reportesController = {
  // GET /api/reportes/resumen  (KPIs del dashboard)
  resumen: asyncHandler(async (_req, res) => {
    const resumen = await reportesService.resumen();
    res.json({ ok: true, datos: resumen });
  }),

  // GET /api/reportes/ganancias?desde=&hasta=&cliente=&plataforma=
  ganancias: asyncHandler(async (req, res) => {
    const filas = await reportesService.ganancias(req.query);
    res.json({ ok: true, total: filas.length, datos: filas });
  }),

  // GET /api/reportes/ganancias-por-plataforma
  gananciasPorPlataforma: asyncHandler(async (_req, res) => {
    const filas = await reportesService.gananciasPorPlataforma();
    res.json({ ok: true, total: filas.length, datos: filas });
  }),

  // GET /api/reportes/ganancias-por-cliente
  gananciasPorCliente: asyncHandler(async (_req, res) => {
    const filas = await reportesService.gananciasPorCliente();
    res.json({ ok: true, total: filas.length, datos: filas });
  }),

  // GET /api/reportes/pipeline-cotizaciones
  pipelineCotizaciones: asyncHandler(async (_req, res) => {
    const filas = await reportesService.pipelineCotizaciones();
    res.json({ ok: true, total: filas.length, datos: filas });
  }),
};

module.exports = reportesController;

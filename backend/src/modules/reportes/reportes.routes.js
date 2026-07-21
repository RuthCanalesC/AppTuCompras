/**
 * ============================================================
 * Rutas de REPORTES (RF-12: reportes gerenciales)
 * ------------------------------------------------------------
 *  GET /api/reportes/resumen                   KPIs del dashboard
 *  GET /api/reportes/ganancias                 Detalle con prorrateo
 *                                              `?desde=&hasta=&cliente=&plataforma=`
 *  GET /api/reportes/ganancias-por-plataforma  Rentabilidad por tienda
 *  GET /api/reportes/ganancias-por-cliente     Rentabilidad por cliente
 *  GET /api/reportes/pipeline-cotizaciones     Cotizaciones por estado con montos
 * ============================================================
 */
const { Router } = require('express');
const reportesController = require('./reportes.controller');

const router = Router();

router.get('/resumen', reportesController.resumen);
router.get('/ganancias', reportesController.ganancias);
router.get('/ganancias-por-plataforma', reportesController.gananciasPorPlataforma);
router.get('/ganancias-por-cliente', reportesController.gananciasPorCliente);
router.get('/pipeline-cotizaciones', reportesController.pipelineCotizaciones);

module.exports = router;

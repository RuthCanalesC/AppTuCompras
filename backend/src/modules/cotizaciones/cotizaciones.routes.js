/**
 * ============================================================
 * Rutas de COTIZACIONES
 * ------------------------------------------------------------
 *  GET    /api/cotizaciones              Listado gerencial (vista)
 *  GET    /api/cotizaciones/:id          Cabecera + detalle
 *  POST   /api/cotizaciones              Alta (sp_crear_cotizacion)
 *  POST   /api/cotizaciones/:id/detalle  Producto + recálculo (SP)
 *  PATCH  /api/cotizaciones/:id/estado   Cambio de estado validado
 * ============================================================
 */
const { Router } = require('express');
const cotizacionesController = require('./cotizaciones.controller');

const router = Router();

router.get('/', cotizacionesController.listar);
router.get('/:id', cotizacionesController.obtener);
router.post('/', cotizacionesController.crear);
router.post('/:id/detalle', cotizacionesController.agregarDetalle);
router.patch('/:id/estado', cotizacionesController.cambiarEstado);

module.exports = router;

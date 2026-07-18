/**
 * ============================================================
 * Rutas de CASILLEROS
 * ------------------------------------------------------------
 *  GET  /api/casilleros       Catálogo (filtros ?estado= &pais=)
 *  GET  /api/casilleros/:id   Detalle
 *  POST /api/casilleros       Alta (soporta expansión a nuevos países)
 *  PUT  /api/casilleros/:id   Actualización (tarifa auditada por trigger)
 * ============================================================
 */
const { Router } = require('express');
const casillerosController = require('./casilleros.controller');

const router = Router();

router.get('/', casillerosController.listar);
router.get('/:id', casillerosController.obtener);
router.post('/', casillerosController.crear);
router.put('/:id', casillerosController.actualizar);

module.exports = router;

/**
 * ============================================================
 * Rutas de ENVÍOS
 * ------------------------------------------------------------
 *  GET    /api/envios        Lista `?compra=&estado=`
 *  GET    /api/envios/:id    Detalle con casillero y cliente
 *  POST   /api/envios        Alta (compra viva + casillero activo)
 *  PATCH  /api/envios/:id    Fechas, pesos, flete, aduana y estado
 * ============================================================
 */
const { Router } = require('express');
const enviosController = require('./envios.controller');

const router = Router();

router.get('/', enviosController.listar);
router.get('/:id', enviosController.obtener);
router.post('/', enviosController.crear);
router.patch('/:id', enviosController.actualizar);

module.exports = router;

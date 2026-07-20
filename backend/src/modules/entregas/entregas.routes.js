/**
 * ============================================================
 * Rutas de ENTREGAS
 * ------------------------------------------------------------
 *  GET   /api/entregas       Lista `?estado=` (con ganancia si existe)
 *  GET   /api/entregas/:id   Detalle + cierre financiero completo
 *  POST  /api/entregas       Procesa la entrega (sp_procesar_entrega):
 *                            liquidación contra entrega, bloqueo con
 *                            saldo (RN-05) y cierre de ganancias.
 * ============================================================
 */
const { Router } = require('express');
const entregasController = require('./entregas.controller');

const router = Router();

router.get('/', entregasController.listar);
router.get('/:id', entregasController.obtener);
router.post('/', entregasController.procesar);

module.exports = router;

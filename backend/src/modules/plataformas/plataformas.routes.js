/**
 * ============================================================
 * Rutas de PLATAFORMAS
 * ------------------------------------------------------------
 *  GET  /api/plataformas       Catálogo (filtro ?estado=Activa)
 *  GET  /api/plataformas/:id   Detalle
 *  POST /api/plataformas       Alta
 *  PUT  /api/plataformas/:id   Actualización (comisión auditada por trigger)
 * ============================================================
 */
const { Router } = require('express');
const plataformasController = require('./plataformas.controller');

const router = Router();

router.get('/', plataformasController.listar);
router.get('/:id', plataformasController.obtener);
router.post('/', plataformasController.crear);
router.put('/:id', plataformasController.actualizar);

module.exports = router;

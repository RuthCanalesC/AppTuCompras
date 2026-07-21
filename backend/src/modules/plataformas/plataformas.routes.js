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
const { requireRole } = require('../../middlewares/auth');

const router = Router();

// Lectura: ambos roles. Escritura: solo Administrador (Fase 11).
router.get('/', plataformasController.listar);
router.get('/:id', plataformasController.obtener);
router.post('/', requireRole('Administrador'), plataformasController.crear);
router.put('/:id', requireRole('Administrador'), plataformasController.actualizar);

module.exports = router;

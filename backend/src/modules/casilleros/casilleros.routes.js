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
const { requireRole } = require('../../middlewares/auth');

const router = Router();

// Lectura: ambos roles. Escritura: solo Administrador (Fase 11).
router.get('/', casillerosController.listar);
router.get('/:id', casillerosController.obtener);
router.post('/', requireRole('Administrador'), casillerosController.crear);
router.put('/:id', requireRole('Administrador'), casillerosController.actualizar);

module.exports = router;

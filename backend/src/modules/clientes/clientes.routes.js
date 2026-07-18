/**
 * ============================================================
 * Rutas de CLIENTES
 * ------------------------------------------------------------
 *  GET    /api/clientes        Lista con filtros
 *  GET    /api/clientes/:id    Detalle
 *  POST   /api/clientes        Alta (usa sp_registrar_cliente)
 *  PUT    /api/clientes/:id    Actualización parcial
 *  (No hay DELETE: RN-07 — el historial comercial nunca se borra;
 *   para "eliminar" un cliente se cambia su estado a Inactivo.)
 * ============================================================
 */
const { Router } = require('express');
const clientesController = require('./clientes.controller');

const router = Router();

router.get('/', clientesController.listar);
router.get('/:id', clientesController.obtener);
router.post('/', clientesController.crear);
router.put('/:id', clientesController.actualizar);

module.exports = router;

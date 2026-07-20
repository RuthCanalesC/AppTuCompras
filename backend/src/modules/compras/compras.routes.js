/**
 * ============================================================
 * Rutas de COMPRAS y ABONOS
 * ------------------------------------------------------------
 *  GET    /api/compras                        Lista `?estado=&con_saldo=true`
 *  GET    /api/compras/pendientes-pago        Cuentas por cobrar (vista)
 *  GET    /api/compras/:id                    Cabecera + productos + abonos
 *  GET    /api/compras/:id/estado-cuenta      Estado de cuenta del cliente
 *  POST   /api/compras                        Alta (sp_registrar_compra)
 *  POST   /api/compras/:id/abonos             Abono (triggers de saldo)
 *  PATCH  /api/compras/:id/estado             Estado logístico validado
 *  PATCH  /api/compras/:id/detalle/:idDetalle Orden/tracking/peso/estado producto
 *
 * Nota: /pendientes-pago se declara ANTES de /:id para que Express
 * no lo interprete como un ID.
 * ============================================================
 */
const { Router } = require('express');
const comprasController = require('./compras.controller');

const router = Router();

router.get('/', comprasController.listar);
router.get('/pendientes-pago', comprasController.pendientesPago);
router.get('/:id', comprasController.obtener);
router.get('/:id/estado-cuenta', comprasController.estadoCuenta);
router.post('/', comprasController.registrar);
router.post('/:id/abonos', comprasController.abonar);
router.patch('/:id/estado', comprasController.cambiarEstado);
router.patch('/:id/detalle/:idDetalle', comprasController.actualizarDetalle);

module.exports = router;

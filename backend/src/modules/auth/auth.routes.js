/**
 * ============================================================
 * Rutas de AUTENTICACIÓN / USUARIOS
 * ------------------------------------------------------------
 *  POST  /api/auth/login                 Pública (entrega el JWT)
 *  GET   /api/auth/perfil                Autenticado
 *  GET   /api/auth/usuarios              Solo Administrador
 *  POST  /api/auth/usuarios              Solo Administrador
 *  PATCH /api/auth/usuarios/:id/estado   Solo Administrador
 * ============================================================
 */
const { Router } = require('express');
const authController = require('./auth.controller');
const { authRequired, requireRole } = require('../../middlewares/auth');

const router = Router();

router.post('/login', authController.login);
router.get('/perfil', authRequired, authController.perfil);

router.get('/usuarios', authRequired, requireRole('Administrador'), authController.listarUsuarios);
router.post('/usuarios', authRequired, requireRole('Administrador'), authController.crearUsuario);
router.patch('/usuarios/:id/estado', authRequired, requireRole('Administrador'), authController.cambiarEstado);

module.exports = router;

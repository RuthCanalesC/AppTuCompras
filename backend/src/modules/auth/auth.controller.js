/**
 * ============================================================
 * Controlador de AUTENTICACIÓN / USUARIOS (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const authService = require('./auth.service');

const authController = {
  // POST /api/auth/login  { usuario, password }
  login: asyncHandler(async (req, res) => {
    const sesion = await authService.login(req.body);
    res.json({
      ok: true,
      mensaje: `Bienvenido(a), ${sesion.usuario.nombre_completo}.`,
      datos: sesion,
    });
  }),

  // GET /api/auth/perfil  (requiere token)
  perfil: asyncHandler(async (req, res) => {
    const cuenta = await authService.perfil(req.usuario.id_usuario);
    res.json({ ok: true, datos: cuenta });
  }),

  // GET /api/auth/usuarios  (solo Administrador)
  listarUsuarios: asyncHandler(async (_req, res) => {
    const usuarios = await authService.listarUsuarios();
    res.json({ ok: true, total: usuarios.length, datos: usuarios });
  }),

  // POST /api/auth/usuarios  (solo Administrador)
  // { nombre_completo, usuario, email?, password, rol? }
  crearUsuario: asyncHandler(async (req, res) => {
    const usuario = await authService.crearUsuario(req.body);
    res.status(201).json({
      ok: true,
      mensaje: `Usuario "${usuario.usuario}" creado con rol ${usuario.rol}.`,
      datos: usuario,
    });
  }),

  // PATCH /api/auth/usuarios/:id/estado  { estado }  (solo Administrador)
  cambiarEstado: asyncHandler(async (req, res) => {
    const usuario = await authService.cambiarEstado(req.params.id, req.body.estado, req.usuario);
    res.json({
      ok: true,
      mensaje: `Usuario "${usuario.usuario}" ahora está ${usuario.estado}.`,
      datos: usuario,
    });
  }),
};

module.exports = authController;

/**
 * ============================================================
 * Controlador de PLATAFORMAS (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const plataformasService = require('./plataformas.service');

const plataformasController = {
  listar: asyncHandler(async (req, res) => {
    const plataformas = await plataformasService.listar(req.query);
    res.json({ ok: true, total: plataformas.length, datos: plataformas });
  }),

  obtener: asyncHandler(async (req, res) => {
    const plataforma = await plataformasService.obtenerPorId(req.params.id);
    res.json({ ok: true, datos: plataforma });
  }),

  crear: asyncHandler(async (req, res) => {
    const plataforma = await plataformasService.crear(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Plataforma registrada correctamente.',
      datos: plataforma,
    });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const plataforma = await plataformasService.actualizar(req.params.id, req.body);
    res.json({
      ok: true,
      mensaje: 'Plataforma actualizada correctamente.',
      datos: plataforma,
    });
  }),
};

module.exports = plataformasController;

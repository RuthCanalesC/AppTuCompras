/**
 * ============================================================
 * Controlador de CASILLEROS (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const casillerosService = require('./casilleros.service');

const casillerosController = {
  listar: asyncHandler(async (req, res) => {
    const casilleros = await casillerosService.listar(req.query);
    res.json({ ok: true, total: casilleros.length, datos: casilleros });
  }),

  obtener: asyncHandler(async (req, res) => {
    const casillero = await casillerosService.obtenerPorId(req.params.id);
    res.json({ ok: true, datos: casillero });
  }),

  crear: asyncHandler(async (req, res) => {
    const casillero = await casillerosService.crear(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Casillero registrado correctamente.',
      datos: casillero,
    });
  }),

  actualizar: asyncHandler(async (req, res) => {
    const casillero = await casillerosService.actualizar(req.params.id, req.body);
    res.json({
      ok: true,
      mensaje: 'Casillero actualizado correctamente.',
      datos: casillero,
    });
  }),
};

module.exports = casillerosController;

/**
 * ============================================================
 * Controlador de CLIENTES (capa HTTP)
 * ------------------------------------------------------------
 * Traduce peticiones HTTP a llamadas del servicio y respuestas
 * JSON. No contiene lógica de negocio ni SQL.
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const clientesService = require('./clientes.service');

const clientesController = {
  // GET /api/clientes?estado=Activo&tipo=Personal&buscar=maria
  listar: asyncHandler(async (req, res) => {
    const clientes = await clientesService.listar(req.query);
    res.json({ ok: true, total: clientes.length, datos: clientes });
  }),

  // GET /api/clientes/:id
  obtener: asyncHandler(async (req, res) => {
    const cliente = await clientesService.obtenerPorId(req.params.id);
    res.json({ ok: true, datos: cliente });
  }),

  // POST /api/clientes
  crear: asyncHandler(async (req, res) => {
    const cliente = await clientesService.registrar(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Cliente registrado correctamente.',
      datos: cliente,
    });
  }),

  // PUT /api/clientes/:id
  actualizar: asyncHandler(async (req, res) => {
    const cliente = await clientesService.actualizar(req.params.id, req.body);
    res.json({
      ok: true,
      mensaje: 'Cliente actualizado correctamente.',
      datos: cliente,
    });
  }),
};

module.exports = clientesController;

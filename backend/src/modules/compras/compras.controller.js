/**
 * ============================================================
 * Controlador de COMPRAS y ABONOS (capa HTTP)
 * ============================================================
 */
const asyncHandler = require('../../utils/asyncHandler');
const comprasService = require('./compras.service');

const comprasController = {
  // GET /api/compras?estado=Comprada&con_saldo=true
  listar: asyncHandler(async (req, res) => {
    const compras = await comprasService.listar(req.query);
    res.json({ ok: true, total: compras.length, datos: compras });
  }),

  // GET /api/compras/pendientes-pago  (cuentas por cobrar - vista gerencial)
  pendientesPago: asyncHandler(async (_req, res) => {
    const pendientes = await comprasService.pendientesPago();
    res.json({ ok: true, total: pendientes.length, datos: pendientes });
  }),

  // GET /api/compras/:id  (cabecera + productos + abonos)
  obtener: asyncHandler(async (req, res) => {
    const compra = await comprasService.obtenerPorId(req.params.id);
    res.json({ ok: true, datos: compra });
  }),

  // GET /api/compras/:id/estado-cuenta
  estadoCuenta: asyncHandler(async (req, res) => {
    const cuenta = await comprasService.estadoCuenta(req.params.id);
    res.json({ ok: true, datos: cuenta });
  }),

  // POST /api/compras
  // { id_cotizacion, costo_productos_usd, tasa_cambio, anticipo_hnl?, metodo_pago? }
  registrar: asyncHandler(async (req, res) => {
    const compra = await comprasService.registrar(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Compra registrada. El anticipo quedó aplicado como primer abono.',
      datos: compra,
    });
  }),

  // POST /api/compras/:id/abonos
  // { monto_hnl, metodo_pago?, referencia?, observaciones? }
  abonar: asyncHandler(async (req, res) => {
    const compra = await comprasService.abonar(req.params.id, req.body);
    res.status(201).json({
      ok: true,
      mensaje: `Abono registrado. Saldo pendiente: L ${compra.saldo_pendiente_hnl}.`,
      datos: compra,
    });
  }),

  // PATCH /api/compras/:id/estado  { estado: "En_Casillero" }
  cambiarEstado: asyncHandler(async (req, res) => {
    const compra = await comprasService.cambiarEstado(req.params.id, req.body.estado);
    res.json({
      ok: true,
      mensaje: `Compra en estado ${compra.estado}.`,
      datos: compra,
    });
  }),

  // PATCH /api/compras/:id/detalle/:idDetalle
  // { numero_orden_plataforma?, tracking_tienda?, peso_real_lb?, estado_producto? }
  actualizarDetalle: asyncHandler(async (req, res) => {
    const compra = await comprasService.actualizarDetalle(
      req.params.id,
      req.params.idDetalle,
      req.body
    );
    res.json({
      ok: true,
      mensaje: 'Producto actualizado.',
      datos: compra,
    });
  }),
};

module.exports = comprasController;

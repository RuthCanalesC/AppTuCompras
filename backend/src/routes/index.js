/**
 * ============================================================
 * Enrutador principal de la API
 * ------------------------------------------------------------
 * Punto único donde se montan todos los módulos bajo /api.
 * Al agregar un módulo nuevo (cotizaciones, compras, etc.) solo
 * se registra aquí — el resto de la aplicación no cambia.
 * ============================================================
 */
const { Router } = require('express');

const clientesRoutes = require('../modules/clientes/clientes.routes');
const plataformasRoutes = require('../modules/plataformas/plataformas.routes');
const casillerosRoutes = require('../modules/casilleros/casilleros.routes');
const cotizacionesRoutes = require('../modules/cotizaciones/cotizaciones.routes');

const router = Router();

// Salud de la API (útil para monitoreo y para el frontend)
router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'TuCompras API',
    version: '1.0.0',
    fecha: new Date().toISOString(),
  });
});

router.use('/clientes', clientesRoutes);
router.use('/plataformas', plataformasRoutes);
router.use('/casilleros', casillerosRoutes);
router.use('/cotizaciones', cotizacionesRoutes);

module.exports = router;

/**
 * ============================================================
 * Enrutador principal de la API
 * ------------------------------------------------------------
 * Aplica la MATRIZ DE PRIVILEGIOS de la Fase 11 del proyecto:
 *
 *  | Recurso                        | Administrador | Operaciones |
 *  |--------------------------------|---------------|-------------|
 *  | /auth/login, /health           | público       | público     |
 *  | clientes, cotizaciones         | total         | total       |
 *  | plataformas, casilleros (GET)  | sí            | sí (lectura)|
 *  | plataformas, casilleros (POST/PUT) | sí        | NO          |
 *  | compras, abonos, envíos,       | sí            | NO          |
 *  | entregas, reportes             |               | (finanzas)  |
 *  | gestión de usuarios (/auth)    | sí            | NO          |
 * ============================================================
 */
const { Router } = require('express');
const { authRequired, requireRole } = require('../middlewares/auth');

const authRoutes = require('../modules/auth/auth.routes');
const clientesRoutes = require('../modules/clientes/clientes.routes');
const plataformasRoutes = require('../modules/plataformas/plataformas.routes');
const casillerosRoutes = require('../modules/casilleros/casilleros.routes');
const cotizacionesRoutes = require('../modules/cotizaciones/cotizaciones.routes');
const comprasRoutes = require('../modules/compras/compras.routes');
const enviosRoutes = require('../modules/envios/envios.routes');
const entregasRoutes = require('../modules/entregas/entregas.routes');
const reportesRoutes = require('../modules/reportes/reportes.routes');

const router = Router();

// ---- Rutas públicas ----
router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'TuCompras API',
    version: '1.0.0',
    fecha: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes); // /login es pública; el resto se protege adentro

// ---- Rutas autenticadas (ambos roles) ----
router.use('/clientes', authRequired, clientesRoutes);
router.use('/cotizaciones', authRequired, cotizacionesRoutes);

// Catálogos: lectura para ambos; escritura solo Administrador
// (el control fino por método está dentro de cada archivo de rutas)
router.use('/plataformas', authRequired, plataformasRoutes);
router.use('/casilleros', authRequired, casillerosRoutes);

// ---- Módulo financiero y logístico: solo Administrador ----
router.use('/compras', authRequired, requireRole('Administrador'), comprasRoutes);
router.use('/envios', authRequired, requireRole('Administrador'), enviosRoutes);
router.use('/entregas', authRequired, requireRole('Administrador'), entregasRoutes);
router.use('/reportes', authRequired, requireRole('Administrador'), reportesRoutes);

module.exports = router;

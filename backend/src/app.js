/**
 * ============================================================
 * Aplicación Express (composición de middlewares y rutas)
 * ------------------------------------------------------------
 * Se separa de server.js para poder importar `app` en pruebas
 * automatizadas sin levantar el puerto real.
 *
 * Orden de middlewares:
 *   1. helmet   -> cabeceras HTTP de seguridad
 *   2. cors     -> permite que el frontend consuma la API
 *   3. morgan   -> log de cada petición (solo desarrollo)
 *   4. express.json -> parseo del cuerpo JSON
 *   5. /api     -> rutas de negocio
 *   6. 404 y manejador central de errores
 * ============================================================
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const apiRoutes = require('./routes');
const openapi = require('./docs/openapi');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

// Documentación interactiva (Swagger UI) y especificación cruda
app.get('/api/docs.json', (_req, res) => res.json(openapi));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: 'TuCompras API — Documentación',
    swaggerOptions: { persistAuthorization: true }, // conserva el token entre recargas
  })
);

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

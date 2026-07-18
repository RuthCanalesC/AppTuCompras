/**
 * ============================================================
 * Configuración de entorno (capa de configuración)
 * ------------------------------------------------------------
 * Centraliza la lectura de variables de entorno para que el
 * resto de la aplicación NUNCA acceda a process.env directamente.
 * Ventaja: un solo lugar para validar y documentar la configuración.
 * ============================================================
 */
require('dotenv').config();

const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'admin_tucompras',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tucompras_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  },
};

module.exports = env;

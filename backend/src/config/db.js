/**
 * ============================================================
 * Conexión a MySQL (capa de acceso a datos)
 * ------------------------------------------------------------
 * Usa un POOL de conexiones (mysql2/promise):
 *  - Reutiliza conexiones en lugar de abrir una por consulta.
 *  - Soporta async/await en todos los repositorios.
 *  - namedPlaceholders permite consultas con :nombre en vez de ?
 * ============================================================
 */
const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: env.db.connectionLimit,
  waitForConnections: true,
  namedPlaceholders: true,
  decimalNumbers: true, // DECIMAL llega como número JS, no como string
  charset: 'utf8mb4_unicode_ci',
});

/**
 * Verifica que la base de datos responda (usada al arrancar el servidor).
 */
async function checkConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

module.exports = { pool, checkConnection };

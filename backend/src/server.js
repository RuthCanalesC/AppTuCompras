/**
 * ============================================================
 * Punto de entrada del servidor
 * ------------------------------------------------------------
 * Verifica la conexión a MySQL antes de aceptar tráfico:
 * si la base de datos no responde, el proceso termina con
 * error claro en lugar de fallar en la primera petición.
 * ============================================================
 */
const app = require('./app');
const env = require('./config/env');
const { checkConnection } = require('./config/db');

async function main() {
  try {
    await checkConnection();
    console.log(`✔ Conexión a MySQL establecida (${env.db.database})`);

    app.listen(env.port, () => {
      console.log(`✔ TuCompras API escuchando en http://localhost:${env.port}/api`);
      console.log(`  Entorno: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('✖ No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
}

main();

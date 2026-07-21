/**
 * ============================================================
 * Semilla de usuarios de la aplicación
 * ------------------------------------------------------------
 * Crea (si no existen) los dos usuarios iniciales con los roles
 * de la Fase 11, cifrando las contraseñas con bcrypt.
 *
 *   Uso:  node scripts/seed-usuarios.js
 *
 *   admin      / Admin#2026      -> Administrador
 *   operaciones/ Operaciones#2026 -> Operaciones
 *
 * ⚠ Cambie estas contraseñas en producción.
 * ============================================================
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

const USUARIOS_SEMILLA = [
  {
    nombre_completo: 'Administrador TuCompras',
    usuario: 'admin',
    email: 'admin@tucompras.hn',
    password: 'Admin#2026',
    rol: 'Administrador',
  },
  {
    nombre_completo: 'Operaciones TuCompras',
    usuario: 'operaciones',
    email: 'operaciones@tucompras.hn',
    password: 'Operaciones#2026',
    rol: 'Operaciones',
  },
];

async function main() {
  for (const u of USUARIOS_SEMILLA) {
    const [existe] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE usuario = :usuario',
      { usuario: u.usuario }
    );
    if (existe.length) {
      console.log(`• ${u.usuario} ya existe, se omite.`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO usuarios (nombre_completo, usuario, email, password_hash, rol)
       VALUES (:nombre, :usuario, :email, :hash, :rol)`,
      { nombre: u.nombre_completo, usuario: u.usuario, email: u.email, hash, rol: u.rol }
    );
    console.log(`✔ Usuario "${u.usuario}" creado con rol ${u.rol}.`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error('✖ Error en la semilla:', err.message);
  process.exit(1);
});

/**
 * ============================================================
 * Cliente HTTP de la API TuCompras
 * ------------------------------------------------------------
 * - Adjunta automáticamente el JWT en cada petición.
 * - Traduce las respuestas { ok, mensaje, datos } de la API.
 * - Si el token expiró (401), limpia la sesión y recarga para
 *   volver al login.
 * ============================================================
 */
const BASE = '/api';
const TOKEN_KEY = 'tucompras_token';
const USER_KEY = 'tucompras_usuario';

export const sesion = {
  guardar(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },
  token: () => localStorage.getItem(TOKEN_KEY),
  usuario: () => {
    const crudo = localStorage.getItem(USER_KEY);
    return crudo ? JSON.parse(crudo) : null;
  },
  limpiar() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

async function peticion(ruta, { metodo = 'GET', cuerpo } = {}) {
  const cabeceras = { 'Content-Type': 'application/json' };
  const token = sesion.token();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const datos = await respuesta.json().catch(() => ({}));

  // Sesión expirada o token inválido -> volver al login
  if (respuesta.status === 401 && sesion.token()) {
    sesion.limpiar();
    window.location.reload();
    return Promise.reject(new Error('Sesión expirada'));
  }

  if (!respuesta.ok) {
    const error = new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

export const api = {
  get: (ruta) => peticion(ruta),
  post: (ruta, cuerpo) => peticion(ruta, { metodo: 'POST', cuerpo }),
  put: (ruta, cuerpo) => peticion(ruta, { metodo: 'PUT', cuerpo }),
  patch: (ruta, cuerpo) => peticion(ruta, { metodo: 'PATCH', cuerpo }),
};

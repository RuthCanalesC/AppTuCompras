/**
 * ============================================================
 * Contexto de autenticación
 * ------------------------------------------------------------
 * Mantiene la sesión (usuario + rol) disponible en toda la app
 * y expone iniciarSesion / cerrarSesion. El rol controla qué
 * módulos se muestran (matriz de privilegios de la Fase 11).
 * ============================================================
 */
import { createContext, useContext, useState } from 'react';
import { api, sesion } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(sesion.usuario());

  async function iniciarSesion(credenciales) {
    const respuesta = await api.post('/auth/login', credenciales);
    const { token, usuario: cuenta } = respuesta.datos;
    sesion.guardar(token, cuenta);
    setUsuario(cuenta);
    return cuenta;
  }

  function cerrarSesion() {
    sesion.limpiar();
    setUsuario(null);
  }

  const esAdmin = usuario?.rol === 'Administrador';

  return (
    <AuthContext.Provider value={{ usuario, esAdmin, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

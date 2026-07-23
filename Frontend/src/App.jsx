/**
 * ============================================================
 * Enrutador principal de la aplicación
 * ------------------------------------------------------------
 * - /login es pública.
 * - Todo lo demás exige sesión (RutaProtegida).
 * - El Dashboard es la portada del Administrador; Operaciones
 *   entra directo a Clientes (no tiene acceso a reportes).
 * ============================================================
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Catalogos from './pages/Catalogos';
import EnConstruccion from './pages/EnConstruccion';

function RutaProtegida({ children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

function Portada() {
  const { esAdmin } = useAuth();
  return esAdmin ? <Dashboard /> : <Navigate to="/clientes" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            <Route index element={<Portada />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="catalogos" element={<Catalogos />} />
            <Route path="cotizaciones" element={<EnConstruccion titulo="Cotizaciones" />} />
            <Route path="compras" element={<EnConstruccion titulo="Compras" />} />
            <Route path="envios" element={<EnConstruccion titulo="Envíos" />} />
            <Route path="entregas" element={<EnConstruccion titulo="Entregas" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

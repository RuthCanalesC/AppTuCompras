/**
 * ============================================================
 * Layout principal: barra lateral + contenido
 * ------------------------------------------------------------
 * La navegación se filtra por rol (matriz de la Fase 11):
 *   Operaciones  -> Dashboard NO, Clientes, Cotizaciones, Catálogos
 *   Administrador-> todo (incl. Compras, Envíos, Entregas, Reportes)
 * ============================================================
 */
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAVEGACION = [
  { ruta: '/', etiqueta: 'Dashboard', icono: '◆', soloAdmin: true },
  { ruta: '/clientes', etiqueta: 'Clientes', icono: '👤' },
  { ruta: '/cotizaciones', etiqueta: 'Cotizaciones', icono: '🧾' },
  { ruta: '/compras', etiqueta: 'Compras', icono: '🛒', soloAdmin: true },
  { ruta: '/envios', etiqueta: 'Envíos', icono: '✈️' , soloAdmin: true },
  { ruta: '/entregas', etiqueta: 'Entregas', icono: '📦', soloAdmin: true },
  { ruta: '/catalogos', etiqueta: 'Catálogos', icono: '🏬' },
];

export default function Layout() {
  const { usuario, esAdmin, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const enlaces = NAVEGACION.filter((n) => !n.soloAdmin || esAdmin);

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  return (
    <div style={estilos.contenedor}>
      <aside style={estilos.lateral}>
        <div style={estilos.marca}>
          <span style={estilos.logo}>
            TU<span style={{ color: 'var(--dorado)' }}>COMPRAS</span>
          </span>
          <div className="linea-dorada" style={{ marginTop: 8 }} />
        </div>

        <nav style={estilos.nav}>
          {enlaces.map((n) => (
            <NavLink
              key={n.ruta}
              to={n.ruta}
              end={n.ruta === '/'}
              style={({ isActive }) => ({
                ...estilos.enlace,
                ...(isActive ? estilos.enlaceActivo : {}),
              })}
            >
              <span style={{ width: 22, textAlign: 'center' }}>{n.icono}</span>
              {n.etiqueta}
            </NavLink>
          ))}
        </nav>

        <div style={estilos.pie}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--fuente-titulos)', fontSize: 13.5, fontWeight: 500 }}>
              {usuario?.nombre_completo}
            </div>
            <span className="chip chip-neutro" style={{ marginTop: 4 }}>{usuario?.rol}</span>
          </div>
          <button className="btn btn-fantasma" onClick={salir} style={{ width: '100%', justifyContent: 'center' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={estilos.contenido}>
        <Outlet />
      </main>
    </div>
  );
}

const estilos = {
  contenedor: { display: 'flex', minHeight: '100vh' },
  lateral: {
    width: 232,
    flexShrink: 0,
    background: 'var(--superficie-1)',
    borderRight: '1px solid var(--borde-suave)',
    display: 'flex',
    flexDirection: 'column',
    padding: '26px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  marca: { padding: '0 10px', marginBottom: 30 },
  logo: {
    fontFamily: 'var(--fuente-titulos)',
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: 'var(--blanco)',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  enlace: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 'var(--radio-sm)',
    color: 'var(--tinta-2)',
    fontFamily: 'var(--fuente-titulos)',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
  enlaceActivo: {
    background: 'rgba(212, 175, 55, 0.1)',
    color: 'var(--dorado)',
  },
  pie: { borderTop: '1px solid var(--borde-suave)', paddingTop: 16 },
  contenido: { flex: 1, padding: '30px 34px', minWidth: 0 },
};

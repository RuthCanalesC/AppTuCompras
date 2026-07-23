/**
 * ============================================================
 * Página de LOGIN
 * ------------------------------------------------------------
 * Estética del Manual de Identidad: fondo negro premium, línea
 * dorada decorativa, tipografía Poppins y botón dorado.
 * ============================================================
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await iniciarSesion(formulario);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={estilos.fondo}>
      <div style={estilos.panel}>
        <div style={estilos.marca}>
          <span style={estilos.logo}>
            TU<span style={{ color: 'var(--dorado)' }}>COMPRAS</span>
          </span>
          <div className="linea-dorada" style={{ margin: '10px auto 0' }} />
          <p className="texto-atenuado" style={{ marginTop: 12 }}>
            Personal Shopper Internacional
          </p>
        </div>

        <form onSubmit={manejarEnvio} style={estilos.formulario}>
          <div className="campo">
            <label htmlFor="usuario">USUARIO</label>
            <input
              id="usuario"
              autoComplete="username"
              value={formulario.usuario}
              onChange={(e) => setFormulario({ ...formulario, usuario: e.target.value })}
              placeholder="Su nombre de usuario"
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="password">CONTRASEÑA</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formulario.password}
              onChange={(e) => setFormulario({ ...formulario, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="btn btn-oro" disabled={cargando} style={{ justifyContent: 'center' }}>
            {cargando ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="texto-atenuado" style={{ textAlign: 'center', marginTop: 24 }}>
          Sistema de Gestión Integral · Acceso autorizado
        </p>
      </div>
    </div>
  );
}

const estilos = {
  fondo: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'radial-gradient(ellipse at 20% 0%, rgba(212,175,55,0.07) 0%, transparent 55%), var(--superficie-0)',
    padding: 20,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    background: 'var(--superficie-1)',
    border: '1px solid var(--borde-suave)',
    borderRadius: 'var(--radio)',
    boxShadow: 'var(--sombra)',
    padding: '42px 36px',
  },
  marca: { textAlign: 'center', marginBottom: 32 },
  logo: {
    fontFamily: 'var(--fuente-titulos)',
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: 2,
    color: 'var(--blanco)',
  },
  formulario: { display: 'flex', flexDirection: 'column', gap: 18 },
};

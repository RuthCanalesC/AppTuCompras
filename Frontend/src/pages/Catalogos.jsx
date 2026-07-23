/**
 * ============================================================
 * MÓDULO DE CATÁLOGOS: plataformas y casilleros
 * ------------------------------------------------------------
 * Lectura para ambos roles (RF-02 / RF-03). La edición de
 * comisiones y tarifas es de Administrador y queda auditada
 * por los triggers de la base de datos.
 * ============================================================
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EncabezadoPagina, Aviso } from '../components/ui';

export default function Catalogos() {
  const [plataformas, setPlataformas] = useState(null);
  const [casilleros, setCasilleros] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/plataformas'), api.get('/casilleros')])
      .then(([p, c]) => { setPlataformas(p.datos); setCasilleros(c.datos); })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Aviso>{error}</Aviso>;
  if (!plataformas || !casilleros) return <Aviso>Cargando catálogos…</Aviso>;

  return (
    <div>
      <EncabezadoPagina
        titulo="Catálogos"
        subtitulo="Plataformas internacionales y casilleros logísticos"
      />

      <div style={{ display: 'grid', gap: 22 }}>
        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={estilos.tituloTabla}>Plataformas (tiendas)</h3>
          <table className="tabla">
            <thead>
              <tr><th>Tienda</th><th>País</th><th>Comisión</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {plataformas.map((p) => (
                <tr key={p.id_plataforma}>
                  <td>
                    <strong>{p.nombre}</strong>
                    {p.url_sitio && <div className="texto-atenuado">{p.url_sitio}</div>}
                  </td>
                  <td>{p.pais_origen}</td>
                  <td>{Number(p.comision_pct).toFixed(2)} %</td>
                  <td>
                    <span className={`chip ${p.estado === 'Activa' ? 'chip-activo' : 'chip-inactivo'}`}>
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={estilos.tituloTabla}>Casilleros internacionales</h3>
          <table className="tabla">
            <thead>
              <tr><th>Casillero</th><th>Ubicación</th><th>Tarifa / lb</th><th>Tránsito</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {casilleros.map((c) => (
                <tr key={c.id_casillero}>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.ciudad}, {c.pais}</td>
                  <td>$ {Number(c.costo_por_libra_usd).toFixed(2)}</td>
                  <td>{c.dias_transito_estimado} días</td>
                  <td>
                    <span className={`chip ${c.estado === 'Activo' ? 'chip-activo' : 'chip-info'}`}>
                      {c.estado.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const estilos = {
  tituloTabla: { fontSize: 15.5, fontWeight: 600, padding: '18px 14px 8px' },
};

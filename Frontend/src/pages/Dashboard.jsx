/**
 * ============================================================
 * DASHBOARD GERENCIAL (solo Administrador)
 * ------------------------------------------------------------
 * Consume /api/reportes/resumen y las agregaciones para pintar
 * los KPIs del negocio y dos gráficas de una sola serie (dorado).
 * ============================================================
 */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EncabezadoPagina, TarjetaKpi, Aviso, lempiras } from '../components/ui';
import GraficaBarras from '../components/GraficaBarras';

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [porPlataforma, setPorPlataforma] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/reportes/resumen'),
      api.get('/reportes/ganancias-por-plataforma'),
      api.get('/reportes/pipeline-cotizaciones'),
    ])
      .then(([r, gp, pc]) => {
        setResumen(r.datos);
        setPorPlataforma(gp.datos.map((f) => ({ etiqueta: f.plataforma, valor: Number(f.ganancia_neta_hnl) })));
        setPipeline(pc.datos.map((f) => ({ etiqueta: f.estado, valor: Number(f.monto_total_hnl) })));
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Aviso>{error}</Aviso>;
  if (!resumen) return <Aviso>Cargando el resumen del negocio…</Aviso>;

  const { clientes, cotizaciones, compras, cuentas_por_cobrar, rentabilidad } = resumen;

  return (
    <div>
      <EncabezadoPagina
        titulo="Dashboard Gerencial"
        subtitulo="Resumen ejecutivo del negocio en tiempo real"
      />

      {/* --- Fila de KPIs --- */}
      <section style={estilos.kpis}>
        <TarjetaKpi
          etiqueta="Ganancia acumulada"
          valor={lempiras(rentabilidad.ganancia_total_hnl)}
          detalle={`Margen promedio ${rentabilidad.margen_promedio_pct}% · ${rentabilidad.pedidos_cerrados} pedido(s) cerrado(s)`}
        />
        <TarjetaKpi
          etiqueta="Cuentas por cobrar"
          valor={lempiras(cuentas_por_cobrar.saldo_total_hnl)}
          detalle={`${cuentas_por_cobrar.compras_con_saldo} compra(s) con saldo`}
        />
        <TarjetaKpi
          etiqueta="Clientes activos"
          valor={clientes.activos}
          detalle={`${clientes.total} registrados`}
        />
        <TarjetaKpi
          etiqueta="Compras en proceso"
          valor={compras.en_proceso}
          detalle={`${compras.entregadas} entregada(s)`}
        />
      </section>

      {/* --- Gráficas --- */}
      <section style={estilos.graficas}>
        <div className="tarjeta">
          <h3 style={estilos.tituloGrafica}>Ganancia neta por plataforma</h3>
          <p className="texto-atenuado" style={{ marginBottom: 14 }}>
            Lempiras atribuidos por prorrateo a productos entregados
          </p>
          {porPlataforma.length
            ? <GraficaBarras datos={porPlataforma} formatoValor={lempiras} />
            : <Aviso>Aún no hay entregas cerradas.</Aviso>}
        </div>

        <div className="tarjeta">
          <h3 style={estilos.tituloGrafica}>Pipeline de cotizaciones</h3>
          <p className="texto-atenuado" style={{ marginBottom: 14 }}>
            Monto total en Lempiras por estado
          </p>
          {pipeline.length
            ? <GraficaBarras datos={pipeline} formatoValor={lempiras} />
            : <Aviso>No hay cotizaciones registradas.</Aviso>}
        </div>
      </section>

      {/* --- Pipeline numérico --- */}
      <section className="tarjeta" style={{ marginTop: 22 }}>
        <h3 style={estilos.tituloGrafica}>Cotizaciones por estado</h3>
        <div style={estilos.estadoFila}>
          {[
            ['Pendientes', cotizaciones.pendientes],
            ['Enviadas', cotizaciones.enviadas],
            ['Aprobadas', cotizaciones.aprobadas],
            ['Rechazadas', cotizaciones.rechazadas],
            ['Vencidas', cotizaciones.vencidas],
          ].map(([nombre, cantidad]) => (
            <div key={nombre} style={estilos.estadoCelda}>
              <div style={{ fontFamily: 'var(--fuente-titulos)', fontSize: 24, fontWeight: 600 }}>{cantidad}</div>
              <div className="texto-atenuado">{nombre}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const estilos = {
  kpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 22,
  },
  graficas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 16,
  },
  tituloGrafica: { fontSize: 15.5, fontWeight: 600 },
  estadoFila: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
    marginTop: 14,
  },
  estadoCelda: {
    background: 'var(--superficie-2)',
    borderRadius: 'var(--radio-sm)',
    padding: '14px 16px',
    textAlign: 'center',
  },
};

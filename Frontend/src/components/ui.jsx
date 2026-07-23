/**
 * ============================================================
 * Componentes de interfaz reutilizables
 * ============================================================
 */

/** Encabezado estándar de página con línea dorada. */
export function EncabezadoPagina({ titulo, subtitulo, accion }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 26 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>{titulo}</h1>
        {subtitulo && <p className="texto-atenuado" style={{ marginTop: 4 }}>{subtitulo}</p>}
        <div className="linea-dorada" style={{ marginTop: 10 }} />
      </div>
      {accion}
    </header>
  );
}

/** Tarjeta KPI (stat tile): valor protagonista + etiqueta. */
export function TarjetaKpi({ etiqueta, valor, detalle }) {
  return (
    <div className="tarjeta" style={{ padding: '18px 22px' }}>
      <div style={{
        fontFamily: 'var(--fuente-titulos)', fontSize: 12, fontWeight: 500,
        letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--tinta-3)',
      }}>
        {etiqueta}
      </div>
      <div style={{
        fontFamily: 'var(--fuente-titulos)', fontSize: 30, fontWeight: 600,
        color: 'var(--tinta-1)', marginTop: 6, lineHeight: 1.15,
      }}>
        {valor}
      </div>
      {detalle && <div className="texto-atenuado" style={{ marginTop: 4 }}>{detalle}</div>}
    </div>
  );
}

/** Formatea Lempiras. */
export function lempiras(valor) {
  return `L ${Number(valor ?? 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Aviso de carga / error / vacío. */
export function Aviso({ children }) {
  return <div className="texto-atenuado" style={{ padding: '30px 0', textAlign: 'center' }}>{children}</div>;
}

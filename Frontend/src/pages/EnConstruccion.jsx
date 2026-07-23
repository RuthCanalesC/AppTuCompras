/**
 * ============================================================
 * Página temporal para módulos de la siguiente iteración.
 * La API de estos módulos YA está completa y documentada en
 * Swagger; la interfaz se construye en la próxima fase.
 * ============================================================
 */
import { EncabezadoPagina } from '../components/ui';

export default function EnConstruccion({ titulo }) {
  return (
    <div>
      <EncabezadoPagina titulo={titulo} subtitulo="Módulo en construcción" />
      <div className="tarjeta" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛠️</div>
        <h3 style={{ marginBottom: 8 }}>Interfaz en desarrollo</h3>
        <p className="texto-secundario" style={{ maxWidth: 420, margin: '0 auto' }}>
          La API de este módulo ya está completa y probada — puede explorarla en{' '}
          <a href="/api/docs" target="_blank" rel="noreferrer">la documentación Swagger</a>.
          La pantalla se construirá en la siguiente iteración del proyecto.
        </p>
      </div>
    </div>
  );
}

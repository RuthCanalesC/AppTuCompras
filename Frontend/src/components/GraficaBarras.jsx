/**
 * ============================================================
 * Gráfica de barras (SVG propio, sin librerías)
 * ------------------------------------------------------------
 * Sigue la guía de visualización:
 *  - Una sola tonalidad (dorado corporativo): el trabajo de las
 *    barras es comparar MAGNITUDES; la identidad la dan las
 *    etiquetas del eje, no el color.
 *  - Barras delgadas con remate redondeado (4px) anclado a la base.
 *  - Cuadrícula recesiva, texto con tokens de tinta (nunca dorado).
 *  - Tooltip al pasar el cursor con zona de impacto mayor que la barra.
 * ============================================================
 */
import { useState } from 'react';

export default function GraficaBarras({ datos, formatoValor = (v) => v, alto = 220 }) {
  const [activa, setActiva] = useState(null);

  if (!datos?.length) return null;

  const ancho = 520;
  const margen = { arriba: 18, abajo: 30, izq: 10, der: 10 };
  const areaAlto = alto - margen.arriba - margen.abajo;
  const areaAncho = ancho - margen.izq - margen.der;

  const maximo = Math.max(...datos.map((d) => d.valor), 1);
  const paso = areaAncho / datos.length;
  const anchoBarra = Math.min(38, paso * 0.5);

  // Líneas de cuadrícula (4 divisiones, recesivas)
  const divisiones = [0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${ancho} ${alto}`} style={{ width: '100%', display: 'block' }} role="img">
        {/* Cuadrícula recesiva */}
        {divisiones.map((f) => {
          const y = margen.arriba + areaAlto * (1 - f);
          return (
            <line
              key={f}
              x1={margen.izq} x2={ancho - margen.der}
              y1={y} y2={y}
              stroke="var(--borde-suave)" strokeWidth="1"
            />
          );
        })}

        {/* Barras */}
        {datos.map((d, i) => {
          const h = Math.max((d.valor / maximo) * areaAlto, 2);
          const x = margen.izq + paso * i + (paso - anchoBarra) / 2;
          const y = margen.arriba + areaAlto - h;
          const esActiva = activa === i;
          return (
            <g key={d.etiqueta}>
              {/* Remate redondeado solo arriba: rect con radio recortado en la base */}
              <path
                d={`M ${x} ${y + 4}
                    q 0 -4 4 -4
                    h ${anchoBarra - 8}
                    q 4 0 4 4
                    v ${h - 4}
                    h ${-anchoBarra}
                    z`}
                fill="var(--dorado)"
                opacity={activa === null || esActiva ? 1 : 0.45}
                style={{ transition: 'opacity 0.12s ease' }}
              />
              {/* Zona de impacto más grande que la barra */}
              <rect
                x={margen.izq + paso * i} y={margen.arriba}
                width={paso} height={areaAlto}
                fill="transparent"
                onMouseEnter={() => setActiva(i)}
                onMouseLeave={() => setActiva(null)}
              />
              {/* Etiqueta del eje X */}
              <text
                x={x + anchoBarra / 2}
                y={alto - 10}
                textAnchor="middle"
                fill="var(--tinta-2)"
                fontSize="11.5"
                fontFamily="var(--fuente-texto)"
              >
                {d.etiqueta}
              </text>
              {/* Etiqueta directa del valor (selectiva: solo al pasar el cursor) */}
              {esActiva && (
                <text
                  x={x + anchoBarra / 2}
                  y={y - 7}
                  textAnchor="middle"
                  fill="var(--tinta-1)"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="var(--fuente-titulos)"
                >
                  {formatoValor(d.valor)}
                </text>
              )}
            </g>
          );
        })}

        {/* Línea base */}
        <line
          x1={margen.izq} x2={ancho - margen.der}
          y1={margen.arriba + areaAlto} y2={margen.arriba + areaAlto}
          stroke="var(--borde)" strokeWidth="1"
        />
      </svg>
    </div>
  );
}

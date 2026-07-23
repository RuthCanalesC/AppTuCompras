# TuCompras Web — Frontend

Aplicación web React del **Sistema de Gestión Integral TuCompras**, construida con
**Vite + React Router** y diseñada según el **Manual de Identidad Corporativa v1.0**:
Negro Premium `#121212` · Dorado Corporativo `#D4AF37` · tipografías **Poppins** (títulos)
y **Roboto** (texto) — "Elegancia, confianza y conexión internacional".

## Estructura

```
frontend/src/
├── main.jsx / App.jsx        # arranque y enrutador (rutas protegidas por sesión)
├── styles/global.css         # sistema de diseño: tokens de marca, botones, tablas, chips
├── api/client.js             # cliente HTTP: adjunta el JWT, maneja 401 (sesión expirada)
├── auth/AuthContext.jsx      # sesión y rol disponibles en toda la app
├── components/
│   ├── Layout.jsx            # barra lateral con navegación filtrada por rol
│   ├── ui.jsx                # EncabezadoPagina, TarjetaKpi, formateo de Lempiras
│   └── GraficaBarras.jsx     # gráfica SVG propia (sin librerías) con tooltip
└── pages/
    ├── Login.jsx             # login contra /api/auth/login
    ├── Dashboard.jsx         # KPIs + gráficas (solo Administrador)
    ├── Clientes.jsx          # lista, búsqueda, alta y edición
    ├── Catalogos.jsx         # plataformas y casilleros (lectura)
    └── EnConstruccion.jsx    # módulos de la siguiente iteración
```

## Decisiones de diseño

- **Navegación por rol:** el menú lateral se filtra con la matriz de privilegios de la
  Fase 11 — Operaciones no ve Dashboard, Compras, Envíos ni Entregas, y entra
  directo a Clientes.
- **Gráficas de una sola tonalidad (dorado):** las barras comparan magnitudes; la
  identidad la dan las etiquetas del eje. Marcas delgadas con remate redondeado,
  cuadrícula recesiva, tooltip con zona de impacto mayor que la barra y etiqueta
  directa selectiva (solo al pasar el cursor) — siguiendo la guía de visualización.
- **Manejo de sesión:** el JWT viaja en cada petición; un 401 (token expirado)
  limpia la sesión y devuelve al login automáticamente.

## Desarrollo

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxy /api -> backend :4000)
```

Requiere el backend corriendo (`cd ../backend && npm start`).

Credenciales semilla: `admin` / `Admin#2026` (Administrador) ·
`operaciones` / `Operaciones#2026` (Operaciones).

## Próxima iteración

Pantallas de cotizaciones (crear + detalle + estados), compras (estado de cuenta
y abonos), envíos y entregas — la API de todos estos módulos ya está completa
y documentada en `/api/docs`.

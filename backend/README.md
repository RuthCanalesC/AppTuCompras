# TuCompras API — Backend

API REST del **Sistema de Gestión Integral TuCompras** (Personal Shopper Internacional).
Construida con **Node.js + Express + MySQL**, sobre la base de datos `tucompras_db`
(12 tablas, 5 procedimientos almacenados, 5 triggers y 3 vistas gerenciales).

## Arquitectura

Arquitectura en capas (*Layered Architecture*), organizada por módulos de negocio:

```
src/
├── server.js                  # Punto de entrada (verifica BD antes de arrancar)
├── app.js                     # Composición Express (middlewares + rutas)
├── config/
│   ├── env.js                 # Configuración centralizada (.env)
│   └── db.js                  # Pool de conexiones MySQL (mysql2/promise)
├── middlewares/
│   └── errorHandler.js        # 404 + manejador central de errores
├── utils/
│   ├── ApiError.js            # Errores de negocio con código HTTP
│   └── asyncHandler.js        # Captura de errores async
├── routes/
│   └── index.js               # Enrutador principal /api
└── modules/                   # Un módulo por entidad de negocio
    ├── clientes/
    │   ├── clientes.routes.js      # Capa HTTP: endpoints
    │   ├── clientes.controller.js  # Capa HTTP: petición/respuesta
    │   ├── clientes.service.js     # Lógica de negocio y validaciones
    │   └── clientes.repository.js  # Acceso a datos (SQL / SP)
    ├── plataformas/
    └── casilleros/
```

**Flujo de una petición:** `Ruta → Controlador → Servicio → Repositorio → MySQL`

Principios aplicados: separación de responsabilidades, única capa con SQL (repositorios),
validación en aplicación **y** en base de datos (defensa en profundidad), errores de los
procedimientos almacenados (`SIGNAL 45000`) traducidos a respuestas HTTP 400 legibles.

## Requisitos

- Node.js 18+
- MySQL 8.x / MariaDB con la base `tucompras_db` cargada (`database/tucompras_bd.sql`)

## Instalación

```bash
cd backend
npm install
cp .env.example .env    # ajustar credenciales si es necesario
npm start               # o: npm run dev (recarga automática)
```

La API queda en `http://localhost:4000/api`.

## Endpoints implementados

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio |
| GET | `/api/clientes` | Lista con filtros `?estado=&tipo=&buscar=` |
| GET | `/api/clientes/:id` | Detalle de cliente |
| POST | `/api/clientes` | Alta (usa `sp_registrar_cliente`) |
| PUT | `/api/clientes/:id` | Actualización parcial |
| GET | `/api/plataformas` | Catálogo de tiendas `?estado=Activa` |
| GET | `/api/plataformas/:id` | Detalle |
| POST | `/api/plataformas` | Alta de plataforma |
| PUT | `/api/plataformas/:id` | Actualización (comisión auditada por trigger) |
| GET | `/api/casilleros` | Catálogo logístico `?estado=&pais=` |
| GET | `/api/casilleros/:id` | Detalle |
| POST | `/api/casilleros` | Alta (expansión a nuevos países) |
| PUT | `/api/casilleros/:id` | Actualización (tarifa auditada por trigger) |
| GET | `/api/cotizaciones` | Listado gerencial `?estado=&cliente=` (vista `vw_resumen_cotizaciones`) |
| GET | `/api/cotizaciones/:id` | Cabecera + líneas de detalle |
| POST | `/api/cotizaciones` | Alta (usa `sp_crear_cotizacion`) |
| POST | `/api/cotizaciones/:id/detalle` | Agrega producto; el SP recalcula subtotal, envío, comisión y totales USD/HNL |
| PATCH | `/api/cotizaciones/:id/estado` | Cambio de estado con máquina de estados validada |
| GET | `/api/compras` | Lista `?estado=&con_saldo=true` |
| GET | `/api/compras/pendientes-pago` | Cuentas por cobrar (vista `vw_compras_pendientes_pago`) |
| GET | `/api/compras/:id` | Cabecera + productos + historial de abonos |
| GET | `/api/compras/:id/estado-cuenta` | Estado de cuenta: total, abonado, saldo, % pagado |
| POST | `/api/compras` | Alta desde cotización Aprobada (usa `sp_registrar_compra`) |
| POST | `/api/compras/:id/abonos` | Abono; los triggers validan y actualizan el saldo |
| PATCH | `/api/compras/:id/estado` | Estado logístico (Comprada→…→Recibida_HN) validado |
| PATCH | `/api/compras/:id/detalle/:idDetalle` | Orden, tracking, peso real y estado del producto |
| GET | `/api/envios` | Lista `?compra=&estado=` |
| GET | `/api/envios/:id` | Detalle con casillero y cliente |
| POST | `/api/envios` | Alta (compra viva + casillero activo) |
| PATCH | `/api/envios/:id` | Fechas, pesos, flete, aduana y estado logístico |
| GET | `/api/entregas` | Lista con ganancia y margen por entrega |
| GET | `/api/entregas/:id` | Detalle + cierre financiero completo |
| POST | `/api/entregas` | Procesa la entrega (usa `sp_procesar_entrega`) |
| GET | `/api/reportes/resumen` | KPIs del dashboard: clientes, pipeline, CxC, rentabilidad |
| GET | `/api/reportes/ganancias` | Detalle con prorrateo `?desde=&hasta=&cliente=&plataforma=` |
| GET | `/api/reportes/ganancias-por-plataforma` | Rentabilidad agregada por tienda |
| GET | `/api/reportes/ganancias-por-cliente` | Rentabilidad agregada por cliente |
| GET | `/api/reportes/pipeline-cotizaciones` | Cotizaciones por estado con montos |

> No existe DELETE en clientes/catálogos por regla de negocio **RN-07**:
> el historial comercial nunca se borra; se inactiva con `estado`.

## Formato de respuesta

```json
// Éxito
{ "ok": true, "datos": { ... } }

// Error controlado
{ "ok": false, "mensaje": "ERROR: Ya existe un cliente registrado con esa identidad." }
```

## Pruebas realizadas (contra la BD real)

- ✅ Alta de cliente vía `sp_registrar_cliente` (HTTP 201)
- ✅ Rechazo de identidad duplicada (HTTP 400, mensaje del SP)
- ✅ Rechazo de campos obligatorios vacíos (HTTP 400)
- ✅ Detalle y actualización parcial de cliente (HTTP 200)
- ✅ Cliente inexistente (HTTP 404)
- ✅ Filtros de catálogos (`?estado=Activo`)
- ✅ Cambio de comisión registrado automáticamente en `log_auditoria` por trigger

### Reglas de negocio del módulo de cotizaciones

- **Máquina de estados:** `Pendiente → Enviada → Aprobada / Rechazada / Vencida`.
  Los estados finales no admiten cambios (HTTP 409 con la transición explicada).
- No se puede aprobar una cotización **sin productos**.
- El detalle solo se agrega en `Pendiente`/`Enviada` (reforzado por el SP en la BD).
- La tarifa por libra del envío estimado **se resuelve desde el casillero previsto**
  (`id_casillero`), no se digita a mano: cero errores de tarifa.
- Totales verificados contra la validación del proyecto: 2 productos / 2 plataformas
  → $378.46 USD → L 10,029.19 con tasa 26.50. ✅

### Reglas de negocio del módulo de compras y abonos

- **RN-02:** solo cotizaciones `Aprobada` generan compra, y exactamente una
  (reforzado por el SP y el índice UNIQUE en la BD).
- **RN-03/RN-04:** el saldo pendiente **solo** lo mueven los abonos, vía triggers.
  La API jamás escribe `saldo_pendiente_hnl` directamente; un abono que excede
  el saldo es rechazado por el trigger `BEFORE INSERT` y llega como HTTP 400.
- El anticipo se registra automáticamente como primer abono (lo hace el SP).
- **Máquina de estados logística:** `Comprada → En_Casillero → En_Transito →
  En_Aduana → Recibida_HN`. `Entregada` no se asigna manualmente — la asigna
  `sp_procesar_entrega` (módulo de entregas), que exige saldo en cero (RN-05).
  `Cancelada` solo desde `Comprada`.
- Flujo verificado: compra de L 10,029.19 con anticipo de L 5,000 →
  saldo L 5,029.19 calculado por trigger (idéntico a la validación del proyecto). ✅

### Reglas de negocio del módulo de envíos y entregas

- **Envíos:** solo para compras vivas (no Entregada/Cancelada) y casilleros `Activo`.
  Máquina de estados: `En_Casillero → En_Transito → En_Aduana → Recibido_HN`.
  Los costos reales (flete USD, aduana HNL) registrados aquí alimentan el cierre.
- **RN-05:** la entrega con saldo pendiente es **bloqueada por el SP** (HTTP 400).
  Si el cliente paga contra entrega, se envía `monto_liquidacion_hnl` y el SP lo
  aplica como abono final antes de validar.
- Al entregar, `sp_procesar_entrega` cierra en cascada: compra → `Entregada`,
  productos → `Entregado`, y genera el **cierre financiero automático** en
  `entregas_ganancias` (ingreso − productos − flete − aduana − entrega local).
- Ciclo completo verificado: entrega con liquidación de L 3,029.19 →
  ganancia neta L 764.81, margen 7.63% (mismo margen que la validación del proyecto). ✅

### Módulo de reportes (RF-12)

- Se apoya en las vistas de la Fase 9: la lógica pesada (joins, prorrateo por
  producto) vive en la base de datos; la API solo filtra y agrega.
- `/resumen` compone los KPIs con consultas en paralelo (`Promise.all`).
- Filtros de fecha validados (formato `YYYY-MM-DD` y coherencia desde ≤ hasta).
- Verificado con los datos reales del ciclo completo: prorrateo 90.63% / 9.37%
  por producto, idéntico a la validación del proyecto. ✅

## Próximas fases

1. **Autenticación JWT** con roles (Administrador / Operaciones)
2. Documentación **Swagger/OpenAPI**
3. Frontend **React** con dashboard gerencial
4. **Docker** para despliegue

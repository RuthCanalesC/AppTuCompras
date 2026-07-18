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

## Próximas fases

1. Módulo de **cotizaciones** (usa `sp_crear_cotizacion` + `sp_agregar_detalle_cotizacion`)
2. Módulo de **compras y abonos** (usa `sp_registrar_compra`, triggers de saldo)
3. Módulo de **envíos y entregas** (usa `sp_procesar_entrega`)
4. Módulo de **reportes** (vistas `vw_*`)
5. **Autenticación JWT** con roles (Administrador / Operaciones)
6. Documentación **Swagger/OpenAPI**
7. Frontend **React** con dashboard gerencial
8. **Docker** para despliegue

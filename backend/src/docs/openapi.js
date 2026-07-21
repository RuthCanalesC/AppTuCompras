/**
 * ============================================================
 * Especificación OpenAPI 3.0 de la API TuCompras
 * ------------------------------------------------------------
 * Se construye en JavaScript (en lugar de YAML) para poder usar
 * funciones auxiliares y evitar repetición. Swagger UI la sirve
 * en /api/docs y el JSON crudo en /api/docs.json.
 * ============================================================
 */

/* ---------- Auxiliares para respuestas estándar ---------- */

const respuestaOk = (descripcion, datosSchema) => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          mensaje: { type: 'string' },
          total: { type: 'integer' },
          datos: datosSchema || { type: 'object' },
        },
      },
    },
  },
});

const respuestaError = (codigo, descripcion, ejemplo) => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          mensaje: { type: 'string', example: ejemplo },
        },
      },
    },
  },
});

const err400 = (ej) => respuestaError(400, 'Petición inválida o regla de negocio violada', ej);
const err401 = respuestaError(401, 'No autenticado', 'Autenticación requerida: envíe el token en "Authorization: Bearer <token>".');
const err403 = respuestaError(403, 'Sin permisos para este recurso', 'Acceso denegado: se requiere rol Administrador (usted es Operaciones).');
const err404 = (ej) => respuestaError(404, 'Recurso no encontrado', ej);
const err409 = (ej) => respuestaError(409, 'Conflicto con el estado actual', ej);

const idParam = (nombre, descripcion) => ({
  name: nombre,
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description: descripcion,
});

const queryParam = (nombre, descripcion, schema = { type: 'string' }) => ({
  name: nombre,
  in: 'query',
  required: false,
  schema,
  description: descripcion,
});

const cuerpo = (schema, requeridos = []) => ({
  required: true,
  content: {
    'application/json': {
      schema: { type: 'object', required: requeridos, properties: schema },
    },
  },
});

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });
const lista = (nombre) => ({ type: 'array', items: ref(nombre) });

/* ---------- Especificación ---------- */

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'TuCompras API',
    version: '1.0.0',
    description:
      'API REST del **Sistema de Gestión Integral TuCompras** (Personal Shopper Internacional).\n\n' +
      'Cubre el ciclo de negocio completo de 8 etapas: solicitud → cotización → aprobación → ' +
      'compra con anticipo → envío por casillero → aduana → entrega → cierre de ganancias.\n\n' +
      '**Autenticación:** use `POST /auth/login` y pulse *Authorize* para pegar el token.\n\n' +
      '**Roles:** `Administrador` (acceso total) y `Operaciones` (clientes y cotizaciones; catálogos solo lectura; sin finanzas).',
    contact: { name: 'Ruth Canales', email: 'admin@tucompras.hn' },
    license: { name: 'MIT' },
  },
  servers: [{ url: '/api', description: 'Servidor actual' }],
  tags: [
    { name: 'Salud', description: 'Estado del servicio' },
    { name: 'Autenticación', description: 'Login JWT y gestión de usuarios (RF-13)' },
    { name: 'Clientes', description: 'Registro y segmentación de clientes (RF-01)' },
    { name: 'Plataformas', description: 'Catálogo de tiendas y comisiones (RF-02)' },
    { name: 'Casilleros', description: 'Catálogo logístico internacional (RF-03)' },
    { name: 'Cotizaciones', description: 'Cotizaciones multiproducto con totales dinámicos (RF-04/05)' },
    { name: 'Compras y Abonos', description: 'Ejecución de compra y estado de cuenta (RF-06/07)' },
    { name: 'Envíos', description: 'Tránsito internacional y aduana (RF-08)' },
    { name: 'Entregas', description: 'Entrega final y cierre de ganancias (RF-09/10)' },
    { name: 'Reportes', description: 'Reportes gerenciales sobre las vistas (RF-12)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtenido en POST /auth/login',
      },
    },
    schemas: {
      Cliente: {
        type: 'object',
        properties: {
          id_cliente: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'María' },
          apellido: { type: 'string', example: 'Rodríguez' },
          identidad: { type: 'string', example: '0801-1990-12345' },
          telefono: { type: 'string', example: '9988-7766' },
          email: { type: 'string', nullable: true, example: 'maria.r@gmail.com' },
          direccion: { type: 'string', nullable: true },
          ciudad: { type: 'string', example: 'Tegucigalpa' },
          tipo_cliente: { type: 'string', enum: ['Personal', 'Business', 'Express', 'Global'] },
          estado: { type: 'string', enum: ['Activo', 'Inactivo'] },
        },
      },
      Plataforma: {
        type: 'object',
        properties: {
          id_plataforma: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Amazon' },
          url_sitio: { type: 'string', nullable: true },
          pais_origen: { type: 'string', example: 'Estados Unidos' },
          comision_pct: { type: 'number', example: 10.0 },
          estado: { type: 'string', enum: ['Activa', 'Inactiva'] },
        },
      },
      Casillero: {
        type: 'object',
        properties: {
          id_casillero: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Casillero Miami' },
          pais: { type: 'string', example: 'Estados Unidos' },
          ciudad: { type: 'string', example: 'Miami' },
          direccion: { type: 'string' },
          costo_por_libra_usd: { type: 'number', example: 2.5 },
          dias_transito_estimado: { type: 'integer', example: 7 },
          estado: { type: 'string', enum: ['Activo', 'Inactivo', 'En_Apertura'] },
        },
      },
      Cotizacion: {
        type: 'object',
        properties: {
          id_cotizacion: { type: 'integer', example: 1 },
          id_cliente: { type: 'integer', example: 1 },
          tasa_cambio: { type: 'number', example: 26.5 },
          subtotal_productos_usd: { type: 'number', example: 330.99 },
          costo_envio_estimado_usd: { type: 'number', example: 13.75 },
          comision_servicio_usd: { type: 'number', example: 33.72 },
          total_estimado_usd: { type: 'number', example: 378.46 },
          total_estimado_hnl: { type: 'number', example: 10029.19 },
          estado: { type: 'string', enum: ['Pendiente', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida'] },
          detalle: { type: 'array', items: { type: 'object' } },
        },
      },
      Compra: {
        type: 'object',
        properties: {
          id_compra: { type: 'integer', example: 1 },
          id_cotizacion: { type: 'integer', example: 1 },
          costo_productos_usd: { type: 'number', example: 320.0 },
          tasa_cambio: { type: 'number', example: 26.5 },
          total_cliente_hnl: { type: 'number', example: 10029.19 },
          anticipo_hnl: { type: 'number', example: 5000.0 },
          saldo_pendiente_hnl: { type: 'number', example: 5029.19, description: 'Actualizado SOLO por triggers de abonos (RN-04)' },
          estado: { type: 'string', enum: ['Comprada', 'En_Casillero', 'En_Transito', 'En_Aduana', 'Recibida_HN', 'Entregada', 'Cancelada'] },
          detalle: { type: 'array', items: { type: 'object' } },
          abonos: { type: 'array', items: { type: 'object' } },
        },
      },
      Envio: {
        type: 'object',
        properties: {
          id_envio: { type: 'integer', example: 1 },
          id_compra: { type: 'integer', example: 1 },
          id_casillero: { type: 'integer', example: 1 },
          guia_courier: { type: 'string', nullable: true, example: 'UPS-1Z999AA10123456784' },
          peso_facturado_lb: { type: 'number', example: 5.5 },
          costo_flete_usd: { type: 'number', example: 13.75 },
          impuestos_aduana_hnl: { type: 'number', example: 270.0 },
          estado: { type: 'string', enum: ['En_Casillero', 'En_Transito', 'En_Aduana', 'Recibido_HN'] },
        },
      },
      Entrega: {
        type: 'object',
        properties: {
          id_entrega: { type: 'integer', example: 1 },
          id_compra: { type: 'integer', example: 1 },
          direccion_entrega: { type: 'string' },
          ciudad: { type: 'string', example: 'Tegucigalpa' },
          metodo_entrega: { type: 'string', enum: ['Domicilio', 'Punto_Entrega', 'Oficina'] },
          costo_entrega_local_hnl: { type: 'number', example: 150.0 },
          recibido_por: { type: 'string', nullable: true },
          estado: { type: 'string', enum: ['Programada', 'En_Ruta', 'Entregada', 'Fallida'] },
          cierre_financiero: { type: 'object', nullable: true, description: 'Fila de entregas_ganancias generada por sp_procesar_entrega' },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id_usuario: { type: 'integer', example: 1 },
          nombre_completo: { type: 'string', example: 'Administrador TuCompras' },
          usuario: { type: 'string', example: 'admin' },
          email: { type: 'string', nullable: true },
          rol: { type: 'string', enum: ['Administrador', 'Operaciones'] },
          estado: { type: 'string', enum: ['Activo', 'Inactivo'] },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    /* ---------------- Salud ---------------- */
    '/health': {
      get: {
        tags: ['Salud'],
        summary: 'Estado del servicio',
        security: [],
        responses: { 200: respuestaOk('Servicio operativo') },
      },
    },

    /* ---------------- Autenticación ---------------- */
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión y obtener el JWT',
        security: [],
        requestBody: cuerpo(
          {
            usuario: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'Admin#2026' },
          },
          ['usuario', 'password']
        ),
        responses: {
          200: respuestaOk('Sesión iniciada (token + usuario)', {
            type: 'object',
            properties: {
              token: { type: 'string' },
              expira_en: { type: 'string', example: '8h' },
              usuario: ref('Usuario'),
            },
          }),
          401: respuestaError(401, 'Credenciales incorrectas', 'Usuario o contraseña incorrectos.'),
          403: respuestaError(403, 'Cuenta inactiva', 'La cuenta está inactiva; contacte al administrador.'),
        },
      },
    },
    '/auth/perfil': {
      get: {
        tags: ['Autenticación'],
        summary: 'Perfil del usuario autenticado',
        responses: { 200: respuestaOk('Perfil', ref('Usuario')), 401: err401 },
      },
    },
    '/auth/usuarios': {
      get: {
        tags: ['Autenticación'],
        summary: 'Listar usuarios (solo Administrador)',
        responses: { 200: respuestaOk('Usuarios', lista('Usuario')), 401: err401, 403: err403 },
      },
      post: {
        tags: ['Autenticación'],
        summary: 'Crear usuario con contraseña bcrypt (solo Administrador)',
        requestBody: cuerpo(
          {
            nombre_completo: { type: 'string' },
            usuario: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string', minLength: 8 },
            rol: { type: 'string', enum: ['Administrador', 'Operaciones'] },
          },
          ['nombre_completo', 'usuario', 'password']
        ),
        responses: {
          201: respuestaOk('Usuario creado', ref('Usuario')),
          400: err400('La contraseña debe tener al menos 8 caracteres.'),
          401: err401, 403: err403,
          409: err409('Ya existe un registro con esos datos únicos.'),
        },
      },
    },
    '/auth/usuarios/{id}/estado': {
      patch: {
        tags: ['Autenticación'],
        summary: 'Activar / inactivar una cuenta (solo Administrador)',
        parameters: [idParam('id', 'ID del usuario')],
        requestBody: cuerpo({ estado: { type: 'string', enum: ['Activo', 'Inactivo'] } }, ['estado']),
        responses: {
          200: respuestaOk('Estado actualizado', ref('Usuario')),
          401: err401, 403: err403,
          404: err404('No existe un usuario con ID 99.'),
          409: err409('No puede inactivar su propia cuenta.'),
        },
      },
    },

    /* ---------------- Clientes ---------------- */
    '/clientes': {
      get: {
        tags: ['Clientes'],
        summary: 'Listar clientes',
        parameters: [
          queryParam('estado', 'Activo | Inactivo'),
          queryParam('tipo', 'Personal | Business | Express | Global'),
          queryParam('buscar', 'Busca en nombre, apellido, identidad y teléfono'),
        ],
        responses: { 200: respuestaOk('Clientes', lista('Cliente')), 401: err401 },
      },
      post: {
        tags: ['Clientes'],
        summary: 'Registrar cliente (usa sp_registrar_cliente)',
        requestBody: cuerpo(
          {
            nombre: { type: 'string' }, apellido: { type: 'string' },
            identidad: { type: 'string' }, telefono: { type: 'string' },
            email: { type: 'string' }, direccion: { type: 'string' },
            ciudad: { type: 'string' },
            tipo_cliente: { type: 'string', enum: ['Personal', 'Business', 'Express', 'Global'] },
          },
          ['nombre', 'apellido', 'identidad', 'telefono']
        ),
        responses: {
          201: respuestaOk('Cliente registrado', ref('Cliente')),
          400: err400('ERROR: Ya existe un cliente registrado con esa identidad.'),
          401: err401,
        },
      },
    },
    '/clientes/{id}': {
      get: {
        tags: ['Clientes'],
        summary: 'Detalle de un cliente',
        parameters: [idParam('id', 'ID del cliente')],
        responses: { 200: respuestaOk('Cliente', ref('Cliente')), 401: err401, 404: err404('No existe un cliente con ID 999.') },
      },
      put: {
        tags: ['Clientes'],
        summary: 'Actualizar contacto, segmento o estado (sin DELETE: RN-07)',
        parameters: [idParam('id', 'ID del cliente')],
        requestBody: cuerpo({
          telefono: { type: 'string' }, email: { type: 'string' },
          direccion: { type: 'string' }, ciudad: { type: 'string' },
          tipo_cliente: { type: 'string' }, estado: { type: 'string', enum: ['Activo', 'Inactivo'] },
        }),
        responses: { 200: respuestaOk('Cliente actualizado', ref('Cliente')), 400: err400('Estado inválido.'), 401: err401, 404: err404('No existe un cliente con ID 999.') },
      },
    },

    /* ---------------- Plataformas ---------------- */
    '/plataformas': {
      get: {
        tags: ['Plataformas'],
        summary: 'Catálogo de tiendas',
        parameters: [queryParam('estado', 'Activa | Inactiva')],
        responses: { 200: respuestaOk('Plataformas', lista('Plataforma')), 401: err401 },
      },
      post: {
        tags: ['Plataformas'],
        summary: 'Alta de plataforma (solo Administrador)',
        requestBody: cuerpo(
          {
            nombre: { type: 'string' }, url_sitio: { type: 'string' },
            pais_origen: { type: 'string' }, comision_pct: { type: 'number' },
          },
          ['nombre']
        ),
        responses: { 201: respuestaOk('Plataforma creada', ref('Plataforma')), 400: err400('La comisión debe ser un porcentaje entre 0 y 100.'), 401: err401, 403: err403, 409: err409('Ya existe un registro con esos datos únicos.') },
      },
    },
    '/plataformas/{id}': {
      get: {
        tags: ['Plataformas'],
        summary: 'Detalle de una plataforma',
        parameters: [idParam('id', 'ID de la plataforma')],
        responses: { 200: respuestaOk('Plataforma', ref('Plataforma')), 401: err401, 404: err404('No existe una plataforma con ID 99.') },
      },
      put: {
        tags: ['Plataformas'],
        summary: 'Actualizar (cambio de comisión auditado por trigger; solo Administrador)',
        parameters: [idParam('id', 'ID de la plataforma')],
        requestBody: cuerpo({ nombre: { type: 'string' }, comision_pct: { type: 'number' }, estado: { type: 'string' } }),
        responses: { 200: respuestaOk('Plataforma actualizada', ref('Plataforma')), 400: err400('La comisión debe ser un porcentaje entre 0 y 100.'), 401: err401, 403: err403 },
      },
    },

    /* ---------------- Casilleros ---------------- */
    '/casilleros': {
      get: {
        tags: ['Casilleros'],
        summary: 'Catálogo logístico',
        parameters: [queryParam('estado', 'Activo | Inactivo | En_Apertura'), queryParam('pais', 'Filtra por país')],
        responses: { 200: respuestaOk('Casilleros', lista('Casillero')), 401: err401 },
      },
      post: {
        tags: ['Casilleros'],
        summary: 'Alta de casillero — expansión a nuevos países (solo Administrador)',
        requestBody: cuerpo(
          {
            nombre: { type: 'string' }, pais: { type: 'string' }, ciudad: { type: 'string' },
            direccion: { type: 'string' }, costo_por_libra_usd: { type: 'number' },
            dias_transito_estimado: { type: 'integer' }, estado: { type: 'string' },
          },
          ['nombre', 'pais', 'ciudad', 'direccion', 'costo_por_libra_usd']
        ),
        responses: { 201: respuestaOk('Casillero creado', ref('Casillero')), 400: err400('El costo por libra debe ser un número mayor o igual a 0.'), 401: err401, 403: err403 },
      },
    },
    '/casilleros/{id}': {
      get: {
        tags: ['Casilleros'],
        summary: 'Detalle de un casillero',
        parameters: [idParam('id', 'ID del casillero')],
        responses: { 200: respuestaOk('Casillero', ref('Casillero')), 401: err401, 404: err404('No existe un casillero con ID 99.') },
      },
      put: {
        tags: ['Casilleros'],
        summary: 'Actualizar (tarifa auditada por trigger; solo Administrador)',
        parameters: [idParam('id', 'ID del casillero')],
        requestBody: cuerpo({ costo_por_libra_usd: { type: 'number' }, dias_transito_estimado: { type: 'integer' }, estado: { type: 'string' } }),
        responses: { 200: respuestaOk('Casillero actualizado', ref('Casillero')), 401: err401, 403: err403 },
      },
    },

    /* ---------------- Cotizaciones ---------------- */
    '/cotizaciones': {
      get: {
        tags: ['Cotizaciones'],
        summary: 'Listado gerencial (vista vw_resumen_cotizaciones)',
        parameters: [queryParam('estado', 'Pendiente | Enviada | Aprobada | Rechazada | Vencida'), queryParam('cliente', 'ID del cliente')],
        responses: { 200: respuestaOk('Cotizaciones'), 401: err401 },
      },
      post: {
        tags: ['Cotizaciones'],
        summary: 'Crear cotización (usa sp_crear_cotizacion; RN-01: cliente activo)',
        requestBody: cuerpo(
          {
            id_cliente: { type: 'integer', example: 1 },
            tasa_cambio: { type: 'number', example: 26.5, description: 'Se congela en el documento (RN-06)' },
            dias_vigencia: { type: 'integer', example: 5 },
            observaciones: { type: 'string' },
          },
          ['id_cliente', 'tasa_cambio']
        ),
        responses: { 201: respuestaOk('Cotización creada', ref('Cotizacion')), 400: err400('ERROR: El cliente está inactivo; no puede cotizar.'), 401: err401 },
      },
    },
    '/cotizaciones/{id}': {
      get: {
        tags: ['Cotizaciones'],
        summary: 'Cabecera + líneas de detalle',
        parameters: [idParam('id', 'ID de la cotización')],
        responses: { 200: respuestaOk('Cotización', ref('Cotizacion')), 401: err401, 404: err404('No existe una cotización con ID 99.') },
      },
    },
    '/cotizaciones/{id}/detalle': {
      post: {
        tags: ['Cotizaciones'],
        summary: 'Agregar producto — el SP recalcula subtotal, envío, comisión y totales',
        description: 'La tarifa por libra se resuelve desde el casillero previsto (`id_casillero`): el operador nunca la digita.',
        parameters: [idParam('id', 'ID de la cotización')],
        requestBody: cuerpo(
          {
            id_plataforma: { type: 'integer', example: 1 },
            id_casillero: { type: 'integer', example: 1, description: 'Casillero previsto para el envío' },
            descripcion_producto: { type: 'string', example: 'Audífonos Sony WH-1000XM5' },
            url_producto: { type: 'string' },
            cantidad: { type: 'integer', example: 1 },
            precio_unitario_usd: { type: 'number', example: 299.99 },
            peso_estimado_lb: { type: 'number', example: 2.5 },
          },
          ['id_plataforma', 'id_casillero', 'descripcion_producto', 'precio_unitario_usd']
        ),
        responses: { 201: respuestaOk('Producto agregado; totales recalculados', ref('Cotizacion')), 400: err400('ERROR: Solo se puede agregar detalle a cotizaciones Pendientes o Enviadas.'), 401: err401, 404: err404('No existe un casillero con ID 99.') },
      },
    },
    '/cotizaciones/{id}/estado': {
      patch: {
        tags: ['Cotizaciones'],
        summary: 'Cambiar estado (máquina de estados: Pendiente → Enviada → Aprobada/Rechazada/Vencida)',
        parameters: [idParam('id', 'ID de la cotización')],
        requestBody: cuerpo({ estado: { type: 'string', enum: ['Pendiente', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida'] } }, ['estado']),
        responses: { 200: respuestaOk('Estado cambiado', ref('Cotizacion')), 400: err400('No se puede aprobar una cotización sin productos.'), 401: err401, 409: err409('Transición no permitida: Aprobada -> Rechazada. "Aprobada" es un estado final.') },
      },
    },

    /* ---------------- Compras y Abonos ---------------- */
    '/compras': {
      get: {
        tags: ['Compras y Abonos'],
        summary: 'Listar compras (solo Administrador)',
        parameters: [queryParam('estado', 'Estado logístico'), queryParam('con_saldo', 'true = solo con saldo pendiente', { type: 'string', enum: ['true', 'false'] })],
        responses: { 200: respuestaOk('Compras', lista('Compra')), 401: err401, 403: err403 },
      },
      post: {
        tags: ['Compras y Abonos'],
        summary: 'Registrar compra desde cotización Aprobada (sp_registrar_compra; RN-02)',
        description: 'El SP copia el detalle cotizado y registra el anticipo como primer abono; el trigger deja el saldo en total − anticipo.',
        requestBody: cuerpo(
          {
            id_cotizacion: { type: 'integer', example: 1 },
            costo_productos_usd: { type: 'number', example: 320.0 },
            tasa_cambio: { type: 'number', example: 26.5 },
            anticipo_hnl: { type: 'number', example: 5000.0 },
            metodo_pago: { type: 'string', enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'Deposito', 'Billetera_Digital'] },
          },
          ['id_cotizacion', 'costo_productos_usd', 'tasa_cambio']
        ),
        responses: { 201: respuestaOk('Compra registrada', ref('Compra')), 400: err400('ERROR: Esta cotización ya tiene una compra registrada.'), 401: err401, 403: err403 },
      },
    },
    '/compras/pendientes-pago': {
      get: {
        tags: ['Compras y Abonos'],
        summary: 'Cuentas por cobrar (vista vw_compras_pendientes_pago)',
        responses: { 200: respuestaOk('Compras con saldo pendiente'), 401: err401, 403: err403 },
      },
    },
    '/compras/{id}': {
      get: {
        tags: ['Compras y Abonos'],
        summary: 'Cabecera + productos + historial de abonos',
        parameters: [idParam('id', 'ID de la compra')],
        responses: { 200: respuestaOk('Compra', ref('Compra')), 401: err401, 403: err403, 404: err404('No existe una compra con ID 99.') },
      },
    },
    '/compras/{id}/estado-cuenta': {
      get: {
        tags: ['Compras y Abonos'],
        summary: 'Estado de cuenta: total, abonado, saldo y % pagado',
        parameters: [idParam('id', 'ID de la compra')],
        responses: { 200: respuestaOk('Estado de cuenta'), 401: err401, 403: err403, 404: err404('No existe una compra con ID 99.') },
      },
    },
    '/compras/{id}/abonos': {
      post: {
        tags: ['Compras y Abonos'],
        summary: 'Registrar abono — los triggers validan y actualizan el saldo (RN-03/RN-04)',
        parameters: [idParam('id', 'ID de la compra')],
        requestBody: cuerpo(
          {
            monto_hnl: { type: 'number', example: 2000.0 },
            metodo_pago: { type: 'string', enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'Deposito', 'Billetera_Digital'] },
            referencia: { type: 'string' },
            observaciones: { type: 'string' },
          },
          ['monto_hnl']
        ),
        responses: { 201: respuestaOk('Abono aplicado', ref('Compra')), 400: err400('ERROR: El abono excede el saldo pendiente de la compra.'), 401: err401, 403: err403, 409: err409('No se pueden registrar abonos en una compra entregada.') },
      },
    },
    '/compras/{id}/estado': {
      patch: {
        tags: ['Compras y Abonos'],
        summary: 'Estado logístico (Comprada → En_Casillero → En_Transito → En_Aduana → Recibida_HN)',
        description: '"Entregada" no se asigna aquí: la asigna sp_procesar_entrega. "Cancelada" solo desde Comprada.',
        parameters: [idParam('id', 'ID de la compra')],
        requestBody: cuerpo({ estado: { type: 'string' } }, ['estado']),
        responses: { 200: respuestaOk('Estado cambiado', ref('Compra')), 401: err401, 403: err403, 409: err409('Transición no permitida: Comprada -> En_Aduana.') },
      },
    },
    '/compras/{id}/detalle/{idDetalle}': {
      patch: {
        tags: ['Compras y Abonos'],
        summary: 'Actualizar orden, tracking, peso real y estado de un producto',
        parameters: [idParam('id', 'ID de la compra'), idParam('idDetalle', 'ID de la línea de detalle')],
        requestBody: cuerpo({
          numero_orden_plataforma: { type: 'string' },
          tracking_tienda: { type: 'string' },
          peso_real_lb: { type: 'number' },
          estado_producto: { type: 'string', enum: ['Ordenado', 'Recibido_Casillero', 'En_Transito', 'Recibido_HN', 'Entregado', 'Devuelto'] },
        }),
        responses: { 200: respuestaOk('Producto actualizado', ref('Compra')), 401: err401, 403: err403, 404: err404('El producto 99 no pertenece a la compra 1.') },
      },
    },

    /* ---------------- Envíos ---------------- */
    '/envios': {
      get: {
        tags: ['Envíos'],
        summary: 'Listar envíos (solo Administrador)',
        parameters: [queryParam('compra', 'ID de la compra'), queryParam('estado', 'En_Casillero | En_Transito | En_Aduana | Recibido_HN')],
        responses: { 200: respuestaOk('Envíos', lista('Envio')), 401: err401, 403: err403 },
      },
      post: {
        tags: ['Envíos'],
        summary: 'Registrar envío (compra viva + casillero activo)',
        requestBody: cuerpo(
          {
            id_compra: { type: 'integer', example: 1 },
            id_casillero: { type: 'integer', example: 1 },
            guia_courier: { type: 'string' },
            fecha_recepcion_casillero: { type: 'string', example: '2026-07-08 10:00:00' },
            peso_facturado_lb: { type: 'number', example: 5.5 },
            costo_flete_usd: { type: 'number', example: 13.75 },
          },
          ['id_compra', 'id_casillero']
        ),
        responses: { 201: respuestaOk('Envío registrado', ref('Envio')), 400: err400('El casillero "Casillero Panamá" no está activo.'), 401: err401, 403: err403, 409: err409('No se pueden crear envíos para una compra entregada.') },
      },
    },
    '/envios/{id}': {
      get: {
        tags: ['Envíos'],
        summary: 'Detalle del envío',
        parameters: [idParam('id', 'ID del envío')],
        responses: { 200: respuestaOk('Envío', ref('Envio')), 401: err401, 403: err403, 404: err404('No existe un envío con ID 99.') },
      },
      patch: {
        tags: ['Envíos'],
        summary: 'Actualizar fechas, pesos, flete, aduana y estado (En_Casillero → … → Recibido_HN)',
        parameters: [idParam('id', 'ID del envío')],
        requestBody: cuerpo({
          guia_courier: { type: 'string' },
          fecha_salida_origen: { type: 'string' },
          fecha_llegada_hn: { type: 'string' },
          peso_facturado_lb: { type: 'number' },
          costo_flete_usd: { type: 'number' },
          impuestos_aduana_hnl: { type: 'number' },
          estado: { type: 'string' },
        }),
        responses: { 200: respuestaOk('Envío actualizado', ref('Envio')), 401: err401, 403: err403, 409: err409('Transición no permitida: En_Casillero -> Recibido_HN.') },
      },
    },

    /* ---------------- Entregas ---------------- */
    '/entregas': {
      get: {
        tags: ['Entregas'],
        summary: 'Listar entregas con ganancia y margen',
        parameters: [queryParam('estado', 'Programada | En_Ruta | Entregada | Fallida')],
        responses: { 200: respuestaOk('Entregas', lista('Entrega')), 401: err401, 403: err403 },
      },
      post: {
        tags: ['Entregas'],
        summary: 'Procesar entrega final (sp_procesar_entrega) — RN-05 y cierre de ganancias',
        description:
          'El SP: valida que la compra esté Recibida_HN; aplica la liquidación contra entrega (si se envía ' +
          '`monto_liquidacion_hnl`); **bloquea la entrega con saldo pendiente**; cierra compra y productos; ' +
          'y genera el desglose financiero en entregas_ganancias.',
        requestBody: cuerpo(
          {
            id_compra: { type: 'integer', example: 1 },
            direccion_entrega: { type: 'string', example: 'Col. Kennedy, Bloque 5' },
            ciudad: { type: 'string', example: 'Tegucigalpa' },
            metodo_entrega: { type: 'string', enum: ['Domicilio', 'Punto_Entrega', 'Oficina'] },
            costo_entrega_local_hnl: { type: 'number', example: 150.0 },
            recibido_por: { type: 'string', example: 'María Rodríguez' },
            monto_liquidacion_hnl: { type: 'number', example: 3029.19, description: 'Pago final contra entrega (0 si ya pagó)' },
            metodo_pago: { type: 'string', enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'Deposito', 'Billetera_Digital'] },
          },
          ['id_compra', 'direccion_entrega']
        ),
        responses: { 201: respuestaOk('Entrega procesada con cierre financiero', ref('Entrega')), 400: err400('ERROR: No se puede entregar con saldo pendiente. Registre la liquidación.'), 401: err401, 403: err403 },
      },
    },
    '/entregas/{id}': {
      get: {
        tags: ['Entregas'],
        summary: 'Detalle + cierre financiero completo',
        parameters: [idParam('id', 'ID de la entrega')],
        responses: { 200: respuestaOk('Entrega', ref('Entrega')), 401: err401, 403: err403, 404: err404('No existe una entrega con ID 99.') },
      },
    },

    /* ---------------- Reportes ---------------- */
    '/reportes/resumen': {
      get: {
        tags: ['Reportes'],
        summary: 'KPIs del dashboard: clientes, pipeline, compras, CxC y rentabilidad',
        responses: { 200: respuestaOk('Resumen ejecutivo'), 401: err401, 403: err403 },
      },
    },
    '/reportes/ganancias': {
      get: {
        tags: ['Reportes'],
        summary: 'Detalle de ganancias por producto (vista con prorrateo)',
        parameters: [
          queryParam('desde', 'Fecha inicial YYYY-MM-DD'),
          queryParam('hasta', 'Fecha final YYYY-MM-DD (incluyente)'),
          queryParam('cliente', 'Búsqueda parcial por nombre'),
          queryParam('plataforma', 'Nombre exacto de la plataforma'),
        ],
        responses: { 200: respuestaOk('Filas del reporte'), 400: err400('El filtro "desde" debe tener formato YYYY-MM-DD.'), 401: err401, 403: err403 },
      },
    },
    '/reportes/ganancias-por-plataforma': {
      get: {
        tags: ['Reportes'],
        summary: 'Rentabilidad agregada por tienda',
        responses: { 200: respuestaOk('Agregado por plataforma'), 401: err401, 403: err403 },
      },
    },
    '/reportes/ganancias-por-cliente': {
      get: {
        tags: ['Reportes'],
        summary: 'Rentabilidad agregada por cliente',
        responses: { 200: respuestaOk('Agregado por cliente'), 401: err401, 403: err403 },
      },
    },
    '/reportes/pipeline-cotizaciones': {
      get: {
        tags: ['Reportes'],
        summary: 'Cotizaciones por estado con montos totales',
        responses: { 200: respuestaOk('Pipeline comercial'), 401: err401, 403: err403 },
      },
    },
  },
};

module.exports = openapi;

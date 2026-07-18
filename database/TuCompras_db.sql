-- ============================================================================
--  PROYECTO       : TUCOMPRAS - Sistema de Gestión de Personal Shopper
--  BASE DE DATOS  : tucompras_db
--  MOTOR          : MySQL 8.x (compatible con MySQL Workbench)
--  DESCRIPCIÓN    : Script maestro DDL + Programabilidad (SP, Vistas, Triggers)
--  AUTOR          : Arquitectura de Datos - TUCOMPRAS
--  FECHA          : 2026-07-17
--  ORDEN DE EJECUCIÓN: Ejecutar este archivo completo, de arriba hacia abajo,
--                      en el editor SQL de MySQL Workbench.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FASE 7.1 : CREACIÓN DE LA BASE DE DATOS
-- ----------------------------------------------------------------------------
DROP DATABASE IF EXISTS tucompras_db;

CREATE DATABASE tucompras_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tucompras_db;

-- ----------------------------------------------------------------------------
-- FASE 7.2 : TABLAS MAESTRAS (sin dependencias de llaves foráneas)
-- ----------------------------------------------------------------------------

-- ============================================================
-- Tabla: clientes
-- Personas o empresas que solicitan compras internacionales.
-- ============================================================
CREATE TABLE clientes (
    id_cliente       INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(60)      NOT NULL,
    apellido         VARCHAR(60)      NOT NULL,
    telefono         VARCHAR(20)      NOT NULL,
    email            VARCHAR(120)     NULL,
    direccion        VARCHAR(255)     NULL,
    ciudad           VARCHAR(80)      NULL     DEFAULT 'Tegucigalpa',
    tipo_cliente     ENUM('Personal','Business','Express','Global')
                                      NOT NULL DEFAULT 'Personal',
    fecha_registro   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado           ENUM('Activo','Inactivo')
                                      NOT NULL DEFAULT 'Activo',
    CONSTRAINT pk_clientes            PRIMARY KEY (id_cliente),
    CONSTRAINT uq_clientes_email      UNIQUE (email),
    INDEX idx_clientes_nombre         (apellido, nombre),
    INDEX idx_clientes_telefono       (telefono),
    INDEX idx_clientes_estado         (estado)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: plataformas
-- Tiendas internacionales donde se ejecutan las compras
-- (Amazon, SheIn, Temu, New Balance, etc.).
-- ============================================================
CREATE TABLE plataformas (
    id_plataforma    INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(80)      NOT NULL,
    url_sitio        VARCHAR(150)     NULL,
    pais_origen      VARCHAR(60)      NOT NULL DEFAULT 'Estados Unidos',
    comision_pct     DECIMAL(5,2)     NOT NULL DEFAULT 10.00
                     COMMENT 'Porcentaje de comisión de servicio que TUCOMPRAS cobra por compras en esta plataforma',
    estado           ENUM('Activa','Inactiva')
                                      NOT NULL DEFAULT 'Activa',
    CONSTRAINT pk_plataformas         PRIMARY KEY (id_plataforma),
    CONSTRAINT uq_plataformas_nombre  UNIQUE (nombre),
    CONSTRAINT chk_plataformas_comision CHECK (comision_pct >= 0 AND comision_pct <= 100)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: casilleros
-- Direcciones físicas internacionales (Miami, México, futuras
-- expansiones) donde se reciben los paquetes antes de viajar
-- a Honduras.
-- ============================================================
CREATE TABLE casilleros (
    id_casillero             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    nombre                   VARCHAR(80)      NOT NULL,
    pais                     VARCHAR(60)      NOT NULL,
    ciudad                   VARCHAR(80)      NOT NULL,
    direccion                VARCHAR(255)     NOT NULL,
    costo_por_libra_usd      DECIMAL(8,2)     NOT NULL,
    dias_transito_estimado   TINYINT UNSIGNED NOT NULL DEFAULT 7,
    estado                   ENUM('Activo','Inactivo','En_Apertura')
                                              NOT NULL DEFAULT 'Activo',
    CONSTRAINT pk_casilleros            PRIMARY KEY (id_casillero),
    CONSTRAINT uq_casilleros_nombre     UNIQUE (nombre),
    CONSTRAINT chk_casilleros_costo     CHECK (costo_por_libra_usd >= 0),
    INDEX idx_casilleros_pais           (pais),
    INDEX idx_casilleros_estado         (estado)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- FASE 7.3 : TABLAS TRANSACCIONALES DE PRIMER NIVEL
-- ----------------------------------------------------------------------------

-- ============================================================
-- Tabla: cotizaciones
-- Cabecera de la propuesta económica enviada al cliente antes
-- de ejecutar la compra. Los totales se recalculan al agregar
-- líneas de detalle.
-- ============================================================
CREATE TABLE cotizaciones (
    id_cotizacion            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_cliente               INT UNSIGNED     NOT NULL,
    fecha_cotizacion         DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento        DATE             NULL,
    tasa_cambio              DECIMAL(8,4)     NOT NULL
                             COMMENT 'Tasa USD -> HNL vigente al momento de cotizar (fotografía histórica)',
    subtotal_productos_usd   DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    costo_envio_estimado_usd DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    comision_servicio_usd    DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    total_estimado_usd       DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    total_estimado_hnl       DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
    estado                   ENUM('Pendiente','Enviada','Aprobada','Rechazada','Vencida')
                                              NOT NULL DEFAULT 'Pendiente',
    observaciones            TEXT             NULL,
    CONSTRAINT pk_cotizaciones          PRIMARY KEY (id_cotizacion),
    CONSTRAINT fk_cotizaciones_clientes FOREIGN KEY (id_cliente)
        REFERENCES clientes (id_cliente)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_cotizaciones_tasa    CHECK (tasa_cambio > 0),
    INDEX idx_cotizaciones_cliente_estado (id_cliente, estado),
    INDEX idx_cotizaciones_fecha          (fecha_cotizacion)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: cotizacion_detalle  (tabla puente Cotizaciones <-> Plataformas)
-- Rompe la relación N:M entre cotizaciones y plataformas.
-- Cada fila = un producto cotizado en una plataforma.
-- ============================================================
CREATE TABLE cotizacion_detalle (
    id_detalle_cotizacion    INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_cotizacion            INT UNSIGNED     NOT NULL,
    id_plataforma            INT UNSIGNED     NOT NULL,
    descripcion_producto     VARCHAR(255)     NOT NULL,
    url_producto             VARCHAR(500)     NULL,
    cantidad                 INT UNSIGNED     NOT NULL DEFAULT 1,
    precio_unitario_usd      DECIMAL(10,2)    NOT NULL,
    peso_estimado_lb         DECIMAL(8,2)     NOT NULL DEFAULT 0.00,
    subtotal_usd             DECIMAL(12,2)
                             GENERATED ALWAYS AS (cantidad * precio_unitario_usd) STORED,
    CONSTRAINT pk_cotizacion_detalle    PRIMARY KEY (id_detalle_cotizacion),
    CONSTRAINT fk_cotdet_cotizaciones   FOREIGN KEY (id_cotizacion)
        REFERENCES cotizaciones (id_cotizacion)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cotdet_plataformas    FOREIGN KEY (id_plataforma)
        REFERENCES plataformas (id_plataforma)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_cotdet_cantidad      CHECK (cantidad > 0),
    CONSTRAINT chk_cotdet_precio        CHECK (precio_unitario_usd >= 0),
    INDEX idx_cotdet_cotizacion         (id_cotizacion),
    INDEX idx_cotdet_plataforma         (id_plataforma)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: compras
-- Compra real ejecutada tras la aprobación de una cotización.
-- Relación 1:1 con cotizaciones (una cotización aprobada
-- genera una única compra).
-- ============================================================
CREATE TABLE compras (
    id_compra                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_cotizacion            INT UNSIGNED     NOT NULL,
    fecha_compra             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    costo_productos_usd      DECIMAL(12,2)    NOT NULL
                             COMMENT 'Costo real pagado por TUCOMPRAS a las plataformas',
    tasa_cambio              DECIMAL(8,4)     NOT NULL,
    total_cliente_hnl        DECIMAL(14,2)    NOT NULL
                             COMMENT 'Precio total pactado con el cliente en Lempiras',
    anticipo_hnl             DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
    saldo_pendiente_hnl      DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
    estado                   ENUM('Comprada','En_Casillero','En_Transito','En_Aduana',
                                  'Recibida_HN','Entregada','Cancelada')
                                              NOT NULL DEFAULT 'Comprada',
    CONSTRAINT pk_compras               PRIMARY KEY (id_compra),
    CONSTRAINT uq_compras_cotizacion    UNIQUE (id_cotizacion),
    CONSTRAINT fk_compras_cotizaciones  FOREIGN KEY (id_cotizacion)
        REFERENCES cotizaciones (id_cotizacion)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_compras_montos       CHECK (costo_productos_usd >= 0
                                           AND total_cliente_hnl  >= 0
                                           AND anticipo_hnl       >= 0),
    INDEX idx_compras_estado            (estado),
    INDEX idx_compras_fecha             (fecha_compra),
    INDEX idx_compras_saldo             (saldo_pendiente_hnl)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: compra_detalle  (tabla puente Compras <-> Plataformas)
-- Productos realmente comprados, con número de orden y
-- tracking de la tienda. Rompe la relación N:M entre compras
-- y plataformas.
-- ============================================================
CREATE TABLE compra_detalle (
    id_detalle_compra        INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_compra                INT UNSIGNED     NOT NULL,
    id_plataforma            INT UNSIGNED     NOT NULL,
    descripcion_producto     VARCHAR(255)     NOT NULL,
    numero_orden_plataforma  VARCHAR(80)      NULL,
    tracking_tienda          VARCHAR(100)     NULL,
    cantidad                 INT UNSIGNED     NOT NULL DEFAULT 1,
    precio_unitario_usd      DECIMAL(10,2)    NOT NULL,
    impuesto_usd             DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    subtotal_usd             DECIMAL(12,2)
                             GENERATED ALWAYS AS ((cantidad * precio_unitario_usd) + impuesto_usd) STORED,
    peso_real_lb             DECIMAL(8,2)     NULL,
    estado_producto          ENUM('Ordenado','Recibido_Casillero','En_Transito',
                                  'Recibido_HN','Entregado','Devuelto')
                                              NOT NULL DEFAULT 'Ordenado',
    CONSTRAINT pk_compra_detalle        PRIMARY KEY (id_detalle_compra),
    CONSTRAINT fk_compdet_compras       FOREIGN KEY (id_compra)
        REFERENCES compras (id_compra)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_compdet_plataformas   FOREIGN KEY (id_plataforma)
        REFERENCES plataformas (id_plataforma)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_compdet_cantidad     CHECK (cantidad > 0),
    INDEX idx_compdet_compra            (id_compra),
    INDEX idx_compdet_plataforma        (id_plataforma),
    INDEX idx_compdet_estado            (estado_producto),
    INDEX idx_compdet_tracking          (tracking_tienda)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- FASE 7.4 : TABLAS LOGÍSTICAS Y FINANCIERAS
-- ----------------------------------------------------------------------------

-- ============================================================
-- Tabla: envios  (tabla puente Compras <-> Casilleros)
-- Cada compra puede llegar a Honduras en uno o varios envíos,
-- y cada envío pasa por exactamente un casillero. Rompe la
-- relación N:M entre compras y casilleros.
-- ============================================================
CREATE TABLE envios (
    id_envio                 INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_compra                INT UNSIGNED     NOT NULL,
    id_casillero             INT UNSIGNED     NOT NULL,
    guia_courier             VARCHAR(100)     NULL,
    fecha_recepcion_casillero DATETIME        NULL,
    fecha_salida_origen      DATETIME         NULL,
    fecha_llegada_hn         DATETIME         NULL,
    peso_facturado_lb        DECIMAL(8,2)     NOT NULL DEFAULT 0.00,
    costo_flete_usd          DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    impuestos_aduana_hnl     DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    estado                   ENUM('En_Casillero','En_Transito','En_Aduana','Recibido_HN')
                                              NOT NULL DEFAULT 'En_Casillero',
    CONSTRAINT pk_envios                PRIMARY KEY (id_envio),
    CONSTRAINT fk_envios_compras        FOREIGN KEY (id_compra)
        REFERENCES compras (id_compra)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_envios_casilleros     FOREIGN KEY (id_casillero)
        REFERENCES casilleros (id_casillero)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_envios_compra             (id_compra),
    INDEX idx_envios_casillero          (id_casillero),
    INDEX idx_envios_estado             (estado),
    INDEX idx_envios_guia               (guia_courier)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: abonos
-- Pagos parciales o totales realizados por el cliente sobre
-- una compra. El trigger trg_abonos_ai_actualizar_saldo
-- descuenta automáticamente el saldo pendiente.
-- ============================================================
CREATE TABLE abonos (
    id_abono                 INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_compra                INT UNSIGNED     NOT NULL,
    fecha_abono              DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_hnl                DECIMAL(12,2)    NOT NULL,
    metodo_pago              ENUM('Efectivo','Transferencia','Tarjeta','Deposito','Billetera_Digital')
                                              NOT NULL DEFAULT 'Efectivo',
    referencia               VARCHAR(100)     NULL,
    observaciones            VARCHAR(255)     NULL,
    CONSTRAINT pk_abonos                PRIMARY KEY (id_abono),
    CONSTRAINT fk_abonos_compras        FOREIGN KEY (id_compra)
        REFERENCES compras (id_compra)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_abonos_monto         CHECK (monto_hnl > 0),
    INDEX idx_abonos_compra             (id_compra),
    INDEX idx_abonos_fecha              (fecha_abono)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: entregas
-- Entrega final del pedido al cliente en Honduras.
-- Relación 1:1 con compras.
-- ============================================================
CREATE TABLE entregas (
    id_entrega               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_compra                INT UNSIGNED     NOT NULL,
    fecha_entrega            DATETIME         NULL,
    direccion_entrega        VARCHAR(255)     NOT NULL,
    ciudad                   VARCHAR(80)      NOT NULL DEFAULT 'Tegucigalpa',
    metodo_entrega           ENUM('Domicilio','Punto_Entrega','Oficina')
                                              NOT NULL DEFAULT 'Domicilio',
    costo_entrega_local_hnl  DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    recibido_por             VARCHAR(120)     NULL,
    estado                   ENUM('Programada','En_Ruta','Entregada','Fallida')
                                              NOT NULL DEFAULT 'Programada',
    CONSTRAINT pk_entregas              PRIMARY KEY (id_entrega),
    CONSTRAINT uq_entregas_compra       UNIQUE (id_compra),
    CONSTRAINT fk_entregas_compras      FOREIGN KEY (id_compra)
        REFERENCES compras (id_compra)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_entregas_estado           (estado),
    INDEX idx_entregas_fecha            (fecha_entrega),
    INDEX idx_entregas_ciudad           (ciudad)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: entregas_ganancias
-- Cierre financiero de cada pedido entregado: ingresos,
-- desglose de costos y ganancia/pérdida neta.
-- Relación 1:1 con entregas. Poblada por sp_procesar_entrega.
-- ============================================================
CREATE TABLE entregas_ganancias (
    id_ganancia              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    id_entrega               INT UNSIGNED     NOT NULL,
    ingreso_total_hnl        DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
    costo_productos_hnl      DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
    costo_flete_hnl          DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    costo_aduana_hnl         DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    costo_entrega_hnl        DECIMAL(10,2)    NOT NULL DEFAULT 0.00,
    ganancia_neta_hnl        DECIMAL(14,2)    NOT NULL DEFAULT 0.00,
    margen_pct               DECIMAL(6,2)     NOT NULL DEFAULT 0.00,
    fecha_calculo            DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_entregas_ganancias    PRIMARY KEY (id_ganancia),
    CONSTRAINT uq_ganancias_entrega     UNIQUE (id_entrega),
    CONSTRAINT fk_ganancias_entregas    FOREIGN KEY (id_entrega)
        REFERENCES entregas (id_entrega)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_ganancias_fecha           (fecha_calculo)
) ENGINE = InnoDB;

-- ============================================================
-- Tabla: log_auditoria
-- Bitácora histórica de cambios críticos (precios y comisiones)
-- alimentada exclusivamente por triggers de auditoría.
-- ============================================================
CREATE TABLE log_auditoria (
    id_log                   BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    tabla_afectada           VARCHAR(64)      NOT NULL,
    id_registro              INT UNSIGNED     NOT NULL,
    campo_modificado         VARCHAR(64)      NOT NULL,
    valor_anterior           VARCHAR(255)     NULL,
    valor_nuevo              VARCHAR(255)     NULL,
    accion                   ENUM('INSERT','UPDATE','DELETE')
                                              NOT NULL DEFAULT 'UPDATE',
    usuario_sql              VARCHAR(100)     NOT NULL,
    fecha_evento             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_log_auditoria         PRIMARY KEY (id_log),
    INDEX idx_log_tabla                 (tabla_afectada, id_registro),
    INDEX idx_log_fecha                 (fecha_evento)
) ENGINE = InnoDB;

-- ============================================================================
-- FASE 8 : PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES)
-- ============================================================================

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 8.1  sp_registrar_cliente
--      Inserta un cliente nuevo validando datos obligatorios y duplicados.
-- ----------------------------------------------------------------------------
CREATE PROCEDURE sp_registrar_cliente (
    IN  p_nombre        VARCHAR(60),
    IN  p_apellido      VARCHAR(60),
    IN  p_telefono      VARCHAR(20),
    IN  p_email         VARCHAR(120),
    IN  p_direccion     VARCHAR(255),
    IN  p_ciudad        VARCHAR(80),
    IN  p_tipo_cliente  VARCHAR(20),
    OUT p_id_cliente    INT
)
BEGIN
    -- Validación 1: campos obligatorios no vacíos
    IF p_nombre IS NULL OR TRIM(p_nombre) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El nombre del cliente es obligatorio.';
    END IF;

    IF p_apellido IS NULL OR TRIM(p_apellido) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El apellido del cliente es obligatorio.';
    END IF;

    IF p_telefono IS NULL OR TRIM(p_telefono) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El teléfono del cliente es obligatorio.';
    END IF;

    -- Validación 2: formato mínimo de email (si se proporciona)
    IF p_email IS NOT NULL AND p_email NOT LIKE '%_@_%._%' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El formato del correo electrónico no es válido.';
    END IF;

    -- Validación 3: duplicados por telefono
    IF EXISTS (SELECT 1 FROM clientes WHERE telefono = p_telefono) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Ya existe un cliente registrado con este numero de telefono.';
    END IF;

    -- Validación 4: duplicados por email
    IF p_email IS NOT NULL
       AND EXISTS (SELECT 1 FROM clientes WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Ya existe un cliente registrado con ese correo.';
    END IF;

    -- Inserción del cliente
    INSERT INTO clientes (nombre, apellido, telefono, email,
                          direccion, ciudad, tipo_cliente)
    VALUES (TRIM(p_nombre),
            TRIM(p_apellido),
            TRIM(p_telefono),
            p_email,
            p_direccion,
            IFNULL(p_ciudad, 'Tegucigalpa'),
            IFNULL(NULLIF(p_tipo_cliente, ''), 'Personal'));

    SET p_id_cliente = LAST_INSERT_ID();
END $$

-- ----------------------------------------------------------------------------
-- 8.2a sp_crear_cotizacion
--      Crea la cabecera de la cotización para un cliente activo.
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_crear_cotizacion (
    IN  p_id_cliente     INT,
    IN  p_tasa_cambio    DECIMAL(8,4),
    IN  p_dias_vigencia  INT,
    IN  p_observaciones  TEXT,
    OUT p_id_cotizacion  INT
)
BEGIN
    DECLARE v_estado_cliente VARCHAR(10);

    -- Validación 1: existencia y estado del cliente
    SELECT estado INTO v_estado_cliente
    FROM clientes
    WHERE id_cliente = p_id_cliente;

    IF v_estado_cliente IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El cliente indicado no existe.';
    END IF;

    IF v_estado_cliente <> 'Activo' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El cliente está inactivo; no puede cotizar.';
    END IF;

    -- Validación 2: tasa de cambio positiva
    IF p_tasa_cambio IS NULL OR p_tasa_cambio <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La tasa de cambio debe ser mayor que cero.';
    END IF;

    -- Inserción de la cabecera (los totales inician en 0 y se
    -- recalculan al agregar detalle con sp_agregar_detalle_cotizacion)
    INSERT INTO cotizaciones (id_cliente, tasa_cambio, fecha_vencimiento, observaciones)
    VALUES (p_id_cliente,
            p_tasa_cambio,
            DATE_ADD(CURDATE(), INTERVAL IFNULL(p_dias_vigencia, 5) DAY),
            p_observaciones);

    SET p_id_cotizacion = LAST_INSERT_ID();
END $$

-- ----------------------------------------------------------------------------
-- 8.2b sp_agregar_detalle_cotizacion
--      Agrega un producto a la cotización y RECALCULA DINÁMICAMENTE los
--      subtotales, comisión de servicio, envío estimado y totales USD/HNL.
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_agregar_detalle_cotizacion (
    IN p_id_cotizacion        INT,
    IN p_id_plataforma        INT,
    IN p_descripcion          VARCHAR(255),
    IN p_url_producto         VARCHAR(500),
    IN p_cantidad             INT,
    IN p_precio_unitario_usd  DECIMAL(10,2),
    IN p_peso_estimado_lb     DECIMAL(8,2),
    IN p_costo_libra_usd      DECIMAL(8,2)   -- tarifa del casillero previsto
)
BEGIN
    DECLARE v_estado_cot       VARCHAR(15);
    DECLARE v_comision_pct     DECIMAL(5,2);
    DECLARE v_subtotal_usd     DECIMAL(12,2);
    DECLARE v_envio_usd        DECIMAL(10,2);
    DECLARE v_comision_usd     DECIMAL(10,2);
    DECLARE v_tasa             DECIMAL(8,4);

    -- Validación 1: la cotización debe existir y estar editable
    SELECT estado, tasa_cambio INTO v_estado_cot, v_tasa
    FROM cotizaciones
    WHERE id_cotizacion = p_id_cotizacion;

    IF v_estado_cot IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La cotización indicada no existe.';
    END IF;

    IF v_estado_cot NOT IN ('Pendiente', 'Enviada') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Solo se puede agregar detalle a cotizaciones Pendientes o Enviadas.';
    END IF;

    -- Validación 2: plataforma activa
    SELECT comision_pct INTO v_comision_pct
    FROM plataformas
    WHERE id_plataforma = p_id_plataforma
      AND estado = 'Activa';

    IF v_comision_pct IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La plataforma no existe o está inactiva.';
    END IF;

    -- Inserción de la línea de detalle
    INSERT INTO cotizacion_detalle (id_cotizacion, id_plataforma, descripcion_producto,
                                    url_producto, cantidad, precio_unitario_usd,
                                    peso_estimado_lb)
    VALUES (p_id_cotizacion, p_id_plataforma, p_descripcion, p_url_producto,
            IFNULL(p_cantidad, 1), p_precio_unitario_usd,
            IFNULL(p_peso_estimado_lb, 0));

    -- Recalculo dinámico de la cabecera:
    --   subtotal    = SUM(cantidad * precio)
    --   envío est.  = SUM(peso) * costo_por_libra
    --   comisión    = subtotal ponderado por la comisión de cada plataforma
    SELECT  IFNULL(SUM(cd.subtotal_usd), 0),
            IFNULL(SUM(cd.peso_estimado_lb), 0) * IFNULL(p_costo_libra_usd, 0),
            IFNULL(SUM(cd.subtotal_usd * pl.comision_pct / 100), 0)
    INTO    v_subtotal_usd, v_envio_usd, v_comision_usd
    FROM    cotizacion_detalle cd
    INNER JOIN plataformas pl ON pl.id_plataforma = cd.id_plataforma
    WHERE   cd.id_cotizacion = p_id_cotizacion;

    UPDATE cotizaciones
    SET subtotal_productos_usd   = v_subtotal_usd,
        costo_envio_estimado_usd = v_envio_usd,
        comision_servicio_usd    = v_comision_usd,
        total_estimado_usd       = v_subtotal_usd + v_envio_usd + v_comision_usd,
        total_estimado_hnl       = ROUND((v_subtotal_usd + v_envio_usd + v_comision_usd) * v_tasa, 2)
    WHERE id_cotizacion = p_id_cotizacion;
END $$

-- ----------------------------------------------------------------------------
-- 8.3  sp_registrar_compra
--      Registra la compra de una cotización APROBADA, copia el detalle,
--      calcula automáticamente el saldo pendiente (total - anticipo) y
--      registra el anticipo como primer abono.
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_registrar_compra (
    IN  p_id_cotizacion       INT,
    IN  p_costo_productos_usd DECIMAL(12,2),
    IN  p_tasa_cambio         DECIMAL(8,4),
    IN  p_anticipo_hnl        DECIMAL(14,2),
    IN  p_metodo_pago         VARCHAR(20),
    OUT p_id_compra           INT
)
BEGIN
    DECLARE v_estado_cot   VARCHAR(15);
    DECLARE v_total_hnl    DECIMAL(14,2);

    -- Validación 1: la cotización debe existir y estar Aprobada
    SELECT estado, total_estimado_hnl INTO v_estado_cot, v_total_hnl
    FROM cotizaciones
    WHERE id_cotizacion = p_id_cotizacion;

    IF v_estado_cot IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La cotización indicada no existe.';
    END IF;

    IF v_estado_cot <> 'Aprobada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Solo se pueden comprar cotizaciones en estado Aprobada.';
    END IF;

    -- Validación 2: una cotización solo genera una compra (relación 1:1)
    IF EXISTS (SELECT 1 FROM compras WHERE id_cotizacion = p_id_cotizacion) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Esta cotización ya tiene una compra registrada.';
    END IF;

    -- Validación 3: el anticipo no puede superar el total
    IF IFNULL(p_anticipo_hnl, 0) > v_total_hnl THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El anticipo no puede ser mayor que el total de la compra.';
    END IF;

    -- Inserción de la compra.
    -- El saldo inicia igual al total; el trigger de abonos lo irá
    -- descontando (incluido el anticipo, que se registra como abono).
    INSERT INTO compras (id_cotizacion, costo_productos_usd, tasa_cambio,
                         total_cliente_hnl, anticipo_hnl, saldo_pendiente_hnl)
    VALUES (p_id_cotizacion,
            p_costo_productos_usd,
            p_tasa_cambio,
            v_total_hnl,
            IFNULL(p_anticipo_hnl, 0),
            v_total_hnl);            -- saldo inicial = total

    SET p_id_compra = LAST_INSERT_ID();

    -- Copia automática del detalle cotizado hacia el detalle de compra
    INSERT INTO compra_detalle (id_compra, id_plataforma, descripcion_producto,
                                cantidad, precio_unitario_usd)
    SELECT  p_id_compra,
            cd.id_plataforma,
            cd.descripcion_producto,
            cd.cantidad,
            cd.precio_unitario_usd
    FROM    cotizacion_detalle cd
    WHERE   cd.id_cotizacion = p_id_cotizacion;

    -- El anticipo se registra como primer abono:
    -- el trigger trg_abonos_ai_actualizar_saldo calculará
    -- automáticamente: saldo = total - anticipo.
    IF IFNULL(p_anticipo_hnl, 0) > 0 THEN
        INSERT INTO abonos (id_compra, monto_hnl, metodo_pago, observaciones)
        VALUES (p_id_compra,
                p_anticipo_hnl,
                IFNULL(NULLIF(p_metodo_pago, ''), 'Efectivo'),
                'Anticipo inicial de la compra');
    END IF;
END $$

-- ----------------------------------------------------------------------------
-- 8.4  sp_procesar_entrega
--      Registra la entrega en Honduras, exige la liquidación del saldo,
--      cierra la compra y calcula el desglose de ganancias/pérdidas.
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_procesar_entrega (
    IN  p_id_compra              INT,
    IN  p_direccion_entrega      VARCHAR(255),
    IN  p_ciudad                 VARCHAR(80),
    IN  p_metodo_entrega         VARCHAR(20),
    IN  p_costo_entrega_hnl      DECIMAL(10,2),
    IN  p_recibido_por           VARCHAR(120),
    IN  p_monto_liquidacion_hnl  DECIMAL(12,2),  -- pago final del cliente (0 si ya pagó)
    IN  p_metodo_pago            VARCHAR(20),
    OUT p_id_entrega             INT
)
BEGIN
    DECLARE v_estado_compra   VARCHAR(15);
    DECLARE v_saldo           DECIMAL(14,2);
    DECLARE v_ingreso         DECIMAL(14,2);
    DECLARE v_costo_prod      DECIMAL(14,2);
    DECLARE v_costo_flete     DECIMAL(12,2);
    DECLARE v_costo_aduana    DECIMAL(12,2);
    DECLARE v_tasa            DECIMAL(8,4);
    DECLARE v_ganancia        DECIMAL(14,2);

    -- Validación 1: la compra debe existir y haber llegado a Honduras
    SELECT estado, saldo_pendiente_hnl, total_cliente_hnl,
           costo_productos_usd * tasa_cambio, tasa_cambio
    INTO   v_estado_compra, v_saldo, v_ingreso, v_costo_prod, v_tasa
    FROM   compras
    WHERE  id_compra = p_id_compra;

    IF v_estado_compra IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La compra indicada no existe.';
    END IF;

    IF v_estado_compra = 'Entregada' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Esta compra ya fue entregada.';
    END IF;

    IF v_estado_compra NOT IN ('Recibida_HN') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La compra aún no ha sido recibida en Honduras.';
    END IF;

    -- Liquidación del saldo: si el cliente paga al recibir,
    -- se registra el abono final (el trigger descuenta el saldo).
    IF IFNULL(p_monto_liquidacion_hnl, 0) > 0 THEN
        INSERT INTO abonos (id_compra, monto_hnl, metodo_pago, observaciones)
        VALUES (p_id_compra,
                p_monto_liquidacion_hnl,
                IFNULL(NULLIF(p_metodo_pago, ''), 'Efectivo'),
                'Liquidación de saldo contra entrega');
    END IF;

    -- Releer el saldo ya actualizado por el trigger
    SELECT saldo_pendiente_hnl INTO v_saldo
    FROM   compras
    WHERE  id_compra = p_id_compra;

    IF v_saldo > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: No se puede entregar con saldo pendiente. Registre la liquidación.';
    END IF;

    -- Registro de la entrega
    INSERT INTO entregas (id_compra, fecha_entrega, direccion_entrega, ciudad,
                          metodo_entrega, costo_entrega_local_hnl,
                          recibido_por, estado)
    VALUES (p_id_compra,
            NOW(),
            p_direccion_entrega,
            IFNULL(p_ciudad, 'Tegucigalpa'),
            IFNULL(NULLIF(p_metodo_entrega, ''), 'Domicilio'),
            IFNULL(p_costo_entrega_hnl, 0),
            p_recibido_por,
            'Entregada');

    SET p_id_entrega = LAST_INSERT_ID();

    -- Cierre logístico de la compra y sus productos
    UPDATE compras
    SET    estado = 'Entregada'
    WHERE  id_compra = p_id_compra;

    UPDATE compra_detalle
    SET    estado_producto = 'Entregado'
    WHERE  id_compra = p_id_compra;

    -- Costos logísticos reales acumulados de todos los envíos de la compra
    SELECT IFNULL(SUM(e.costo_flete_usd * v_tasa), 0),
           IFNULL(SUM(e.impuestos_aduana_hnl), 0)
    INTO   v_costo_flete, v_costo_aduana
    FROM   envios e
    WHERE  e.id_compra = p_id_compra;

    -- Desglose financiero: ganancia = ingresos - todos los costos
    SET v_ganancia = v_ingreso - v_costo_prod - v_costo_flete
                     - v_costo_aduana - IFNULL(p_costo_entrega_hnl, 0);

    INSERT INTO entregas_ganancias (id_entrega, ingreso_total_hnl,
                                    costo_productos_hnl, costo_flete_hnl,
                                    costo_aduana_hnl, costo_entrega_hnl,
                                    ganancia_neta_hnl, margen_pct)
    VALUES (p_id_entrega,
            v_ingreso,
            v_costo_prod,
            v_costo_flete,
            v_costo_aduana,
            IFNULL(p_costo_entrega_hnl, 0),
            v_ganancia,
            CASE WHEN v_ingreso > 0
                 THEN ROUND(v_ganancia / v_ingreso * 100, 2)
                 ELSE 0 END);
END $$

DELIMITER ;

-- ============================================================================
-- FASE 9 : VISTAS (VIEWS) PARA REPORTES GERENCIALES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9.1  vw_resumen_cotizaciones
--      Historial de cotizaciones por cliente y plataformas involucradas.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_resumen_cotizaciones AS
SELECT
    co.id_cotizacion                                        AS numero_cotizacion,
    CONCAT(cl.nombre, ' ', cl.apellido)                     AS cliente,
    cl.telefono                                             AS telefono,
    cl.tipo_cliente                                         AS tipo_cliente,
    co.fecha_cotizacion                                     AS fecha,
    co.fecha_vencimiento                                    AS vence,
    GROUP_CONCAT(DISTINCT pl.nombre ORDER BY pl.nombre
                 SEPARATOR ', ')                            AS plataformas,
    COUNT(cd.id_detalle_cotizacion)                         AS productos_cotizados,
    IFNULL(SUM(cd.cantidad), 0)                             AS unidades_totales,
    co.subtotal_productos_usd                               AS subtotal_usd,
    co.costo_envio_estimado_usd                             AS envio_estimado_usd,
    co.comision_servicio_usd                                AS comision_usd,
    co.total_estimado_usd                                   AS total_usd,
    co.total_estimado_hnl                                   AS total_lempiras,
    co.estado                                               AS estado
FROM cotizaciones co
INNER JOIN clientes cl           ON cl.id_cliente     = co.id_cliente
LEFT  JOIN cotizacion_detalle cd ON cd.id_cotizacion  = co.id_cotizacion
LEFT  JOIN plataformas pl        ON pl.id_plataforma  = cd.id_plataforma
GROUP BY co.id_cotizacion, cliente, cl.telefono, cl.tipo_cliente,
         co.fecha_cotizacion, co.fecha_vencimiento,
         co.subtotal_productos_usd, co.costo_envio_estimado_usd,
         co.comision_servicio_usd, co.total_estimado_usd,
         co.total_estimado_hnl, co.estado;

-- ----------------------------------------------------------------------------
-- 9.2  vw_compras_pendientes_pago
--      Clientes con saldos pendientes y sus montos totales.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_compras_pendientes_pago AS
SELECT
    cm.id_compra                                            AS numero_compra,
    CONCAT(cl.nombre, ' ', cl.apellido)                     AS cliente,
    cl.telefono                                             AS telefono,
    cl.email                                                AS correo,
    cm.fecha_compra                                         AS fecha_compra,
    cm.estado                                               AS estado_logistico,
    cm.total_cliente_hnl                                    AS total_lempiras,
    IFNULL(SUM(ab.monto_hnl), 0)                            AS total_abonado_hnl,
    cm.saldo_pendiente_hnl                                  AS saldo_pendiente_hnl,
    ROUND(cm.saldo_pendiente_hnl / cm.total_cliente_hnl * 100, 2)
                                                            AS pct_pendiente,
    DATEDIFF(CURDATE(), cm.fecha_compra)                    AS dias_desde_compra
FROM compras cm
INNER JOIN cotizaciones co ON co.id_cotizacion = cm.id_cotizacion
INNER JOIN clientes cl     ON cl.id_cliente    = co.id_cliente
LEFT  JOIN abonos ab       ON ab.id_compra     = cm.id_compra
WHERE cm.saldo_pendiente_hnl > 0
  AND cm.estado <> 'Cancelada'
GROUP BY cm.id_compra, cliente, cl.telefono, cl.email,
         cm.fecha_compra, cm.estado, cm.total_cliente_hnl,
         cm.saldo_pendiente_hnl
ORDER BY cm.saldo_pendiente_hnl DESC;

-- ----------------------------------------------------------------------------
-- 9.3  vw_reporte_ganancias_totales
--      Reporte financiero: desglose de costos, ganancia/pérdida del envío
--      y ganancia neta prorrateada por producto entregado.
-- ----------------------------------------------------------------------------
DELIMITER $$
CREATE OR REPLACE VIEW vw_reporte_ganancias_totales AS
SELECT
    eg.id_ganancia                                          AS id_cierre,
    en.fecha_entrega                                        AS fecha_entrega,
    cm.id_compra                                            AS numero_compra,
    CONCAT(cl.nombre, ' ', cl.apellido)                     AS cliente,
    pl.nombre                                               AS plataforma,
    cdet.descripcion_producto                               AS producto,
    cdet.cantidad                                           AS cantidad,
    cdet.subtotal_usd                                       AS costo_producto_usd,
    -- Prorrateo: peso financiero del producto dentro de su compra
    ROUND(cdet.subtotal_usd /
          NULLIF(tot.suma_detalle_usd, 0) * 100, 2)         AS participacion_pct,
    -- Cifras de la compra completa
    eg.ingreso_total_hnl                                    AS ingreso_compra_hnl,
    eg.costo_productos_hnl                                  AS costo_productos_hnl,
    eg.costo_flete_hnl                                      AS costo_flete_hnl,
    eg.costo_aduana_hnl                                     AS costo_aduana_hnl,
    eg.costo_entrega_hnl                                    AS costo_entrega_hnl,
    (eg.costo_flete_hnl + eg.costo_aduana_hnl
        + eg.costo_entrega_hnl)                             AS costo_logistico_total_hnl,
    eg.ganancia_neta_hnl                                    AS ganancia_neta_compra_hnl,
    -- Ganancia neta atribuida a este producto (prorrateo por costo)
    ROUND(eg.ganancia_neta_hnl * cdet.subtotal_usd /
          NULLIF(tot.suma_detalle_usd, 0), 2)               AS ganancia_neta_producto_hnl,
    eg.margen_pct                                           AS margen_pct,
    CASE WHEN eg.ganancia_neta_hnl >= 0
         THEN 'GANANCIA' ELSE 'PÉRDIDA' END                 AS resultado
FROM entregas_ganancias eg
INNER JOIN entregas en        ON en.id_entrega   = eg.id_entrega
INNER JOIN compras cm         ON cm.id_compra    = en.id_compra
INNER JOIN cotizaciones co    ON co.id_cotizacion = cm.id_cotizacion
INNER JOIN clientes cl        ON cl.id_cliente   = co.id_cliente
INNER JOIN compra_detalle cdet ON cdet.id_compra = cm.id_compra
INNER JOIN plataformas pl     ON pl.id_plataforma = cdet.id_plataforma
INNER JOIN (
        SELECT id_compra, SUM(subtotal_usd) AS suma_detalle_usd
        FROM compra_detalle
        GROUP BY id_compra
     ) tot ON tot.id_compra = cm.id_compra
ORDER BY en.fecha_entrega DESC, cm.id_compra, cdet.id_detalle_compra;

-- ============================================================================
-- FASE 10 : TRIGGERS (DISPARADORES)
-- ============================================================================

DELIMITER $$

-- ----------------------------------------------------------------------------
-- 10.1a trg_abonos_bi_validar
--       BEFORE INSERT en abonos: valida que el monto sea positivo y que
--       no supere el saldo pendiente de la compra.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_abonos_bi_validar
BEFORE INSERT ON abonos
FOR EACH ROW
BEGIN
    DECLARE v_saldo DECIMAL(14,2);

    IF NEW.monto_hnl <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El monto del abono debe ser mayor que cero.';
    END IF;

    SELECT saldo_pendiente_hnl INTO v_saldo
    FROM compras
    WHERE id_compra = NEW.id_compra;

    IF v_saldo IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La compra indicada para el abono no existe.';
    END IF;

    IF NEW.monto_hnl > v_saldo THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: El abono excede el saldo pendiente de la compra.';
    END IF;
END $$

-- ----------------------------------------------------------------------------
-- 10.1b trg_abonos_ai_actualizar_saldo
--       AFTER INSERT en abonos: actualiza automáticamente el estado de
--       cuenta (saldo pendiente) de la compra.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_abonos_ai_actualizar_saldo
AFTER INSERT ON abonos
FOR EACH ROW
BEGIN
    UPDATE compras
    SET saldo_pendiente_hnl = saldo_pendiente_hnl - NEW.monto_hnl
    WHERE id_compra = NEW.id_compra;
END $$

-- ----------------------------------------------------------------------------
-- 10.2a trg_plataformas_au_auditoria
--       Audita cambios en la comisión de servicio por plataforma.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_plataformas_au_auditoria
AFTER UPDATE ON plataformas
FOR EACH ROW
BEGIN
    IF OLD.comision_pct <> NEW.comision_pct THEN
        INSERT INTO log_auditoria (tabla_afectada, id_registro, campo_modificado,
                                   valor_anterior, valor_nuevo, accion, usuario_sql)
        VALUES ('plataformas', NEW.id_plataforma, 'comision_pct',
                CAST(OLD.comision_pct AS CHAR),
                CAST(NEW.comision_pct AS CHAR),
                'UPDATE', CURRENT_USER());
    END IF;
END $$

-- ----------------------------------------------------------------------------
-- 10.2b trg_casilleros_au_auditoria
--       Audita cambios en la tarifa por libra de los casilleros.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_casilleros_au_auditoria
AFTER UPDATE ON casilleros
FOR EACH ROW
BEGIN
    IF OLD.costo_por_libra_usd <> NEW.costo_por_libra_usd THEN
        INSERT INTO log_auditoria (tabla_afectada, id_registro, campo_modificado,
                                   valor_anterior, valor_nuevo, accion, usuario_sql)
        VALUES ('casilleros', NEW.id_casillero, 'costo_por_libra_usd',
                CAST(OLD.costo_por_libra_usd AS CHAR),
                CAST(NEW.costo_por_libra_usd AS CHAR),
                'UPDATE', CURRENT_USER());
    END IF;
END $$

-- ----------------------------------------------------------------------------
-- 10.2c trg_compra_detalle_au_auditoria
--       Audita cambios de precio en productos ya comprados.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_compra_detalle_au_auditoria
AFTER UPDATE ON compra_detalle
FOR EACH ROW
BEGIN
    IF OLD.precio_unitario_usd <> NEW.precio_unitario_usd THEN
        INSERT INTO log_auditoria (tabla_afectada, id_registro, campo_modificado,
                                   valor_anterior, valor_nuevo, accion, usuario_sql)
        VALUES ('compra_detalle', NEW.id_detalle_compra, 'precio_unitario_usd',
                CAST(OLD.precio_unitario_usd AS CHAR),
                CAST(NEW.precio_unitario_usd AS CHAR),
                'UPDATE', CURRENT_USER());
    END IF;
END $$

DELIMITER ;

-- ============================================================================
-- FASE 11 : SEGURIDAD - USUARIOS Y PRIVILEGIOS
-- ============================================================================

-- 11.1 Usuario ADMINISTRADOR: control total de la base de datos.
CREATE USER IF NOT EXISTS 'admin_tucompras'@'localhost'
    IDENTIFIED BY 'Adm1n#TuC0mpras2026!';

GRANT ALL PRIVILEGES ON tucompras_db.*
    TO 'admin_tucompras'@'localhost'
    WITH GRANT OPTION;

-- 11.2 Usuario OPERACIONES / ATENCIÓN AL CLIENTE:
--      solo puede consultar catálogos y crear/actualizar
--      clientes y cotizaciones. NADA de finanzas ni borrados.
CREATE USER IF NOT EXISTS 'operaciones_tc'@'%'
    IDENTIFIED BY 'Oper#TuC0mpras2026!';

GRANT SELECT, INSERT, UPDATE ON tucompras_db.clientes           TO 'operaciones_tc'@'%';
GRANT SELECT, INSERT, UPDATE ON tucompras_db.cotizaciones       TO 'operaciones_tc'@'%';
GRANT SELECT, INSERT, UPDATE ON tucompras_db.cotizacion_detalle TO 'operaciones_tc'@'%';
GRANT SELECT                 ON tucompras_db.plataformas        TO 'operaciones_tc'@'%';
GRANT SELECT                 ON tucompras_db.casilleros         TO 'operaciones_tc'@'%';
GRANT SELECT                 ON tucompras_db.vw_resumen_cotizaciones
                                                                TO 'operaciones_tc'@'%';
GRANT EXECUTE ON PROCEDURE tucompras_db.sp_registrar_cliente    TO 'operaciones_tc'@'%';
GRANT EXECUTE ON PROCEDURE tucompras_db.sp_crear_cotizacion     TO 'operaciones_tc'@'%';
GRANT EXECUTE ON PROCEDURE tucompras_db.sp_agregar_detalle_cotizacion
                                                                TO 'operaciones_tc'@'%';

FLUSH PRIVILEGES;

-- ============================================================================
-- DATOS SEMILLA (CATÁLOGOS INICIALES DE OPERACIÓN)
-- ============================================================================

INSERT INTO plataformas (nombre, url_sitio, pais_origen, comision_pct) VALUES
    ('Amazon',      'https://www.amazon.com',     'Estados Unidos', 10.00),
    ('SheIn',       'https://www.shein.com',      'China',          12.00),
    ('Temu',        'https://www.temu.com',       'China',          12.00),
    ('New Balance', 'https://www.newbalance.com', 'Estados Unidos', 10.00),
    ('eBay',        'https://www.ebay.com',       'Estados Unidos', 11.00);

INSERT INTO casilleros (nombre, pais, ciudad, direccion,
                        costo_por_libra_usd, dias_transito_estimado, estado) VALUES
    ('Casillero Miami',   'Estados Unidos', 'Miami',
     '8290 NW 64th St, Miami, FL 33166',            2.50,  7, 'Activo'),
    ('Casillero México',  'México',         'Ciudad de México',
     'Av. Insurgentes Sur 1602, CDMX 03940',        2.10, 10, 'Activo'),
    ('Casillero Panamá',  'Panamá',         'Ciudad de Panamá',
     'Vía España, Edif. Logistics Hub, Local 12',   2.30,  8, 'En_Apertura');

-- ============================================================================
-- FIN DEL SCRIPT MAESTRO
-- ============================================================================
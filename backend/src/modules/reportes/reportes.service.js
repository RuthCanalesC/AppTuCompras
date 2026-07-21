/**
 * ============================================================
 * Servicio de REPORTES (capa de lógica de negocio)
 * ------------------------------------------------------------
 * Valida los filtros (fechas ISO, rango coherente) y da forma
 * al resumen ejecutivo que consumirá el dashboard del frontend.
 * ============================================================
 */
const ApiError = require('../../utils/ApiError');
const reportesRepository = require('./reportes.repository');

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validarFecha(valor, nombre) {
  if (valor === undefined) return undefined;
  if (!FECHA_REGEX.test(valor) || Number.isNaN(Date.parse(valor))) {
    throw ApiError.badRequest(`El filtro "${nombre}" debe tener formato YYYY-MM-DD.`);
  }
  return valor;
}

const reportesService = {
  /** KPIs para el dashboard gerencial. */
  async resumen() {
    const r = await reportesRepository.resumenEjecutivo();
    return {
      clientes: {
        total: Number(r.clientes.total),
        activos: Number(r.clientes.activos),
      },
      cotizaciones: {
        total: Number(r.cotizaciones.total),
        pendientes: Number(r.cotizaciones.pendientes),
        enviadas: Number(r.cotizaciones.enviadas),
        aprobadas: Number(r.cotizaciones.aprobadas),
        rechazadas: Number(r.cotizaciones.rechazadas),
        vencidas: Number(r.cotizaciones.vencidas),
      },
      compras: {
        total: Number(r.compras.total),
        en_proceso: Number(r.compras.en_proceso),
        entregadas: Number(r.compras.entregadas),
      },
      cuentas_por_cobrar: {
        compras_con_saldo: Number(r.cuentasPorCobrar.compras_con_saldo),
        saldo_total_hnl: Number(r.cuentasPorCobrar.saldo_total_hnl),
      },
      rentabilidad: {
        pedidos_cerrados: Number(r.ganancias.pedidos_cerrados),
        ingresos_hnl: Number(r.ganancias.ingresos_hnl),
        ganancia_total_hnl: Number(r.ganancias.ganancia_total_hnl),
        margen_promedio_pct: Number(r.ganancias.margen_promedio_pct),
      },
    };
  },

  /** Detalle de ganancias por producto, con filtros. */
  async ganancias(filtros) {
    const desde = validarFecha(filtros.desde, 'desde');
    const hasta = validarFecha(filtros.hasta, 'hasta');
    if (desde && hasta && desde > hasta) {
      throw ApiError.badRequest('El filtro "desde" no puede ser posterior a "hasta".');
    }
    return reportesRepository.ganancias({
      desde,
      hasta,
      cliente: filtros.cliente,
      plataforma: filtros.plataforma,
      limit: filtros.limit,
      offset: filtros.offset,
    });
  },

  async gananciasPorPlataforma() {
    return reportesRepository.gananciasPorPlataforma();
  },

  async gananciasPorCliente() {
    return reportesRepository.gananciasPorCliente();
  },

  async pipelineCotizaciones() {
    return reportesRepository.pipelineCotizaciones();
  },
};

module.exports = reportesService;

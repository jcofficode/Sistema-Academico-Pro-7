/**
 * pagosServicio_ap.js — Consumo del módulo de pagos (_ap).
 * Peticiones asíncronas con Axios hacia la API REST de NestJS.
 * Sigue el patrón de academicoServicio_cjgp.js.
 */
import { apiCliente_ahbb } from './api_ahbb';

/**
 * El filtro global del backend anida las respuestas de error estructuradas
 * (ej. { mensaje, violaciones }) dentro de data.mensaje. Este helper las
 * aplana para que las vistas siempre reciban strings y arreglos limpios.
 */
const extraerError_ap = (error_ap, mensajePorDefecto_ap) => {
  const cuerpo_ap = error_ap.response?.data;
  const anidado_ap =
    typeof cuerpo_ap?.mensaje === 'object' && cuerpo_ap?.mensaje !== null
      ? cuerpo_ap.mensaje
      : cuerpo_ap;

  return {
    mensaje:
      (typeof anidado_ap?.mensaje === 'string' && anidado_ap.mensaje) ||
      (typeof cuerpo_ap?.mensaje === 'string' && cuerpo_ap.mensaje) ||
      anidado_ap?.message ||
      mensajePorDefecto_ap,
    violaciones: anidado_ap?.violaciones ?? [],
    errores: anidado_ap?.errores ?? [],
  };
};

// ─── Tarifas ──────────────────────────────────────────────────

export const obtenerTarifas_ap = async () => {
  const respuesta_ap = await apiCliente_ahbb.get('/pagos/tarifas');
  return respuesta_ap.data;
};

export const obtenerTarifaPeriodoActiva_ap = async () => {
  try {
    const respuesta_ap = await apiCliente_ahbb.get('/pagos/tarifas/periodo-activa');
    return respuesta_ap.data;
  } catch {
    return null;
  }
};

export const crearTarifa_ap = async (datos_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.post('/pagos/tarifas', datos_ap);
    return respuesta_ap.data;
  } catch (error_ap) {
    const detalle_ap = extraerError_ap(error_ap, 'Error al crear la tarifa.');
    return { exito: false, ...detalle_ap };
  }
};

export const actualizarTarifa_ap = async (idTarifa_ap, datos_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.patch(`/pagos/tarifas/${idTarifa_ap}`, datos_ap);
    return respuesta_ap.data;
  } catch (error_ap) {
    const detalle_ap = extraerError_ap(error_ap, 'Error al actualizar la tarifa.');
    return { exito: false, ...detalle_ap };
  }
};

export const eliminarTarifa_ap = async (idTarifa_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.delete(`/pagos/tarifas/${idTarifa_ap}`);
    return respuesta_ap.data;
  } catch (error_ap) {
    return {
      exito: false,
      mensaje: error_ap.response?.data?.mensaje ?? 'Error al eliminar la tarifa.',
    };
  }
};

// ─── Pagos del alumno ─────────────────────────────────────────

export const obtenerMisPagos_ap = async () => {
  const respuesta_ap = await apiCliente_ahbb.get('/pagos/mis-pagos');
  return respuesta_ap.data;
};

export const crearPago_ap = async (datos_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.post('/pagos', datos_ap);
    return respuesta_ap.data;
  } catch (error_ap) {
    const detalle_ap = extraerError_ap(error_ap, 'Error al registrar el pago.');
    return { exito: false, ...detalle_ap };
  }
};

export const descargarReciboPago_ap = async (idPago_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.get(`/pagos/recibo/${idPago_ap}`, {
      responseType: 'blob',
    });
    const url_ap = window.URL.createObjectURL(new Blob([respuesta_ap.data]));
    const enlace_ap = document.createElement('a');
    enlace_ap.href = url_ap;
    enlace_ap.download = `recibo-pago-${idPago_ap}.pdf`;
    enlace_ap.click();
    window.URL.revokeObjectURL(url_ap);
    return true;
  } catch {
    return false;
  }
};

// ─── Admin: gestión de pagos ──────────────────────────────────

export const obtenerTodosLosPagos_ap = async (estado_ap) => {
  const params_ap = estado_ap ? { estado: estado_ap } : {};
  const respuesta_ap = await apiCliente_ahbb.get('/pagos/admin/todos', { params: params_ap });
  return respuesta_ap.data;
};

export const confirmarPago_ap = async (idPago_ap, datos_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.patch(`/pagos/admin/${idPago_ap}/confirmar`, datos_ap);
    return respuesta_ap.data;
  } catch (error_ap) {
    return {
      exito: false,
      mensaje: error_ap.response?.data?.mensaje ?? 'Error al procesar el pago.',
    };
  }
};

export const obtenerReporteIngresos_ap = async (idPeriodo_ap) => {
  const respuesta_ap = await apiCliente_ahbb.get(`/pagos/admin/reporte-ingresos/${idPeriodo_ap}`);
  return respuesta_ap.data;
};

// ─── Contratos ────────────────────────────────────────────────

export const obtenerContratos_ap = async () => {
  const respuesta_ap = await apiCliente_ahbb.get('/pagos/contratos');
  return respuesta_ap.data;
};

export const obtenerMiContrato_ap = async () => {
  try {
    const respuesta_ap = await apiCliente_ahbb.get('/pagos/contratos/mi-contrato');
    return respuesta_ap.data;
  } catch {
    return null;
  }
};

export const crearContrato_ap = async (datos_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.post('/pagos/contratos', datos_ap);
    return respuesta_ap.data;
  } catch (error_ap) {
    const detalle_ap = extraerError_ap(error_ap, 'Error al crear el contrato.');
    return { exito: false, ...detalle_ap };
  }
};

export const desactivarContrato_ap = async (idContrato_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.patch(`/pagos/contratos/${idContrato_ap}/desactivar`);
    return respuesta_ap.data;
  } catch (error_ap) {
    return {
      exito: false,
      mensaje: error_ap.response?.data?.mensaje ?? 'Error al desactivar el contrato.',
    };
  }
};

// ─── Nómina ───────────────────────────────────────────────────

export const generarNomina_ap = async (idPeriodo_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.post(`/pagos/nomina/generar/${idPeriodo_ap}`);
    return respuesta_ap.data;
  } catch (error_ap) {
    const detalle_ap = extraerError_ap(error_ap, 'Error al generar la nómina.');
    return { exito: false, ...detalle_ap };
  }
};

export const obtenerNominas_ap = async (idPeriodo_ap) => {
  const respuesta_ap = await apiCliente_ahbb.get(`/pagos/nomina/periodo/${idPeriodo_ap}`);
  return respuesta_ap.data;
};

export const marcarNominaPagada_ap = async (idNomina_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.patch(`/pagos/nomina/${idNomina_ap}/pagar`);
    return respuesta_ap.data;
  } catch (error_ap) {
    return {
      exito: false,
      mensaje: error_ap.response?.data?.mensaje ?? 'Error al marcar la nómina como pagada.',
    };
  }
};

export const obtenerMisRecibosNomina_ap = async () => {
  const respuesta_ap = await apiCliente_ahbb.get('/pagos/nomina/mis-recibos');
  return respuesta_ap.data;
};

export const descargarReciboNomina_ap = async (idNomina_ap) => {
  try {
    const respuesta_ap = await apiCliente_ahbb.get(`/pagos/nomina/recibo/${idNomina_ap}`, {
      responseType: 'blob',
    });
    const url_ap = window.URL.createObjectURL(new Blob([respuesta_ap.data]));
    const enlace_ap = document.createElement('a');
    enlace_ap.href = url_ap;
    enlace_ap.download = `recibo-nomina-${idNomina_ap}.pdf`;
    enlace_ap.click();
    window.URL.revokeObjectURL(url_ap);
    return true;
  } catch {
    return false;
  }
};

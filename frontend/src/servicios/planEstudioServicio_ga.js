/**
 * planEstudioServicio_ga.js — Consumo del módulo Plan de Estudio.
 * Configuración de formatos, elaboración de planes y revisión de coordinación.
 */
import { apiCliente_ahbb } from './api_ahbb';

/**
 * Aplana los errores estructurados que el filtro global del backend anida
 * dentro de data.mensaje (ej. { mensaje, errores }), para que las vistas
 * siempre muestren texto legible.
 */
const extraerError_ga = (error_ga, mensajePorDefecto_ga) => {
  const cuerpo_ga = error_ga.response?.data;
  const anidado_ga =
    typeof cuerpo_ga?.mensaje === 'object' && cuerpo_ga?.mensaje !== null
      ? cuerpo_ga.mensaje
      : cuerpo_ga;

  return {
    mensaje:
      (typeof anidado_ga?.mensaje === 'string' && anidado_ga.mensaje) ||
      (typeof cuerpo_ga?.mensaje === 'string' && cuerpo_ga.mensaje) ||
      anidado_ga?.message ||
      mensajePorDefecto_ga,
    errores: anidado_ga?.errores ?? [],
  };
};

// ─── Plantillas (Admin UI - Épica A) ──────────────────────────

export const obtenerPlantillas_ga = async () => {
  const respuesta_ga = await apiCliente_ahbb.get('/plan-estudio/plantillas');
  return respuesta_ga.data;
};

export const obtenerPlantillaVigente_ga = async (idPeriodo_ga) => {
  const respuesta_ga = await apiCliente_ahbb.get(
    `/plan-estudio/plantillas/vigente/${idPeriodo_ga}`,
  );
  return respuesta_ga.data;
};

export const crearPlantilla_ga = async (datos_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.post(
      '/plan-estudio/plantillas',
      datos_ga,
    );
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(
      error_ga,
      'Error al crear la plantilla de planificación.',
    );
    return { exito: false, ...detalle_ga };
  }
};

export const actualizarPlantilla_ga = async (idPlantilla_ga, datos_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.put(
      `/plan-estudio/plantillas/${idPlantilla_ga}`,
      datos_ga,
    );
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(
      error_ga,
      'Error al actualizar la plantilla.',
    );
    return { exito: false, ...detalle_ga };
  }
};

export const publicarPlantilla_ga = async (idPlantilla_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.patch(
      `/plan-estudio/plantillas/${idPlantilla_ga}/publicar`,
    );
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(
      error_ga,
      'Error al publicar la plantilla.',
    );
    return { exito: false, ...detalle_ga };
  }
};

export const eliminarPlantilla_ga = async (idPlantilla_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.delete(
      `/plan-estudio/plantillas/${idPlantilla_ga}`,
    );
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(
      error_ga,
      'Error al eliminar la plantilla.',
    );
    return { exito: false, ...detalle_ga };
  }
};

// ─── Planes de Estudio (Épica B y C) ──────────────────────────

export const obtenerMisPlanes_ga = async (idPeriodo_ga) => {
  const respuesta_ga = await apiCliente_ahbb.get(
    `/plan-estudio/mis-planes/${idPeriodo_ga}`,
  );
  return respuesta_ga.data;
};

export const obtenerPlanPorId_ga = async (idPlan_ga) => {
  const respuesta_ga = await apiCliente_ahbb.get(`/plan-estudio/${idPlan_ga}`);
  return respuesta_ga.data;
};

export const crearPlan_ga = async (datos_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.post('/plan-estudio', datos_ga);
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(
      error_ga,
      'Error al crear el plan de estudio.',
    );
    return { exito: false, ...detalle_ga };
  }
};

export const actualizarPlan_ga = async (idPlan_ga, datos_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.put(
      `/plan-estudio/${idPlan_ga}`,
      datos_ga,
    );
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(
      error_ga,
      'Error al actualizar el plan de estudio.',
    );
    return { exito: false, ...detalle_ga };
  }
};

export const entregarPlan_ga = async (idPlan_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.patch(
      `/plan-estudio/${idPlan_ga}/entregar`,
    );
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(
      error_ga,
      'Error al entregar el plan de estudio.',
    );
    return { exito: false, ...detalle_ga };
  }
};

// ─── Coordinación (Admin - Épica C) ───────────────────────────

export const obtenerBandejaRevision_ga = async (idPeriodo_ga) => {
  const respuesta_ga = await apiCliente_ahbb.get(
    `/plan-estudio/bandeja/${idPeriodo_ga}`,
  );
  return respuesta_ga.data;
};

export const revisarPlan_ga = async (idPlan_ga, datos_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.patch(
      `/plan-estudio/${idPlan_ga}/revisar`,
      datos_ga,
    );
    return respuesta_ga.data;
  } catch (error_ga) {
    const detalle_ga = extraerError_ga(error_ga, 'Error al revisar el plan.');
    return { exito: false, ...detalle_ga };
  }
};

export const obtenerReporteCumplimiento_ga = async (idPeriodo_ga) => {
  const respuesta_ga = await apiCliente_ahbb.get(
    `/plan-estudio/reporte-cumplimiento/${idPeriodo_ga}`,
  );
  return respuesta_ga.data;
};

// ─── Alumno ───────────────────────────────────────────────────

export const obtenerMisPlanesAlumno_ga = async (idPeriodo_ga) => {
  const respuesta_ga = await apiCliente_ahbb.get(
    `/plan-estudio/alumno/mis-planes/${idPeriodo_ga}`,
  );
  return respuesta_ga.data;
};

// ─── PDF ──────────────────────────────────────────────────────

export const descargarPlanPdf_ga = async (idPlan_ga) => {
  try {
    const respuesta_ga = await apiCliente_ahbb.get(
      `/plan-estudio/${idPlan_ga}/pdf`,
      { responseType: 'blob' },
    );
    const blob_ga = new Blob([respuesta_ga.data], { type: 'application/pdf' });
    window.open(window.URL.createObjectURL(blob_ga), '_blank');
    return true;
  } catch {
    return false;
  }
};

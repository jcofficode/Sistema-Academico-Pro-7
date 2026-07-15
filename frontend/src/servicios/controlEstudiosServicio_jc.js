/**
 * controlEstudiosServicio_jc.js — Consumo del módulo Control de Estudios.
 * Planes de evaluación parametrizados, carga de notas, actas PDF y ETL/CSV.
 */
import { apiCliente_ahbb } from './api_ahbb';

/**
 * Aplana los errores estructurados que el filtro global del backend anida
 * dentro de data.mensaje (ej. { mensaje, errores }), para que las vistas
 * siempre muestren texto legible y nunca "[object Object]".
 */
const extraerError_jc = (error_jc, mensajePorDefecto_jc) => {
  const cuerpo_jc = error_jc.response?.data;
  const anidado_jc =
    typeof cuerpo_jc?.mensaje === 'object' && cuerpo_jc?.mensaje !== null
      ? cuerpo_jc.mensaje
      : cuerpo_jc;

  return {
    mensaje:
      (typeof anidado_jc?.mensaje === 'string' && anidado_jc.mensaje) ||
      (typeof cuerpo_jc?.mensaje === 'string' && cuerpo_jc.mensaje) ||
      anidado_jc?.message ||
      mensajePorDefecto_jc,
    errores: anidado_jc?.errores ?? [],
  };
};

// ─── Planes de Evaluación (Admin UI) ──────────────────────────

export const obtenerPlanes_jc = async () => {
  const respuesta_jc = await apiCliente_ahbb.get(
    '/control-estudios/planes-evaluacion',
  );
  return respuesta_jc.data;
};

export const crearPlan_jc = async (datos_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.post(
      '/control-estudios/planes-evaluacion',
      datos_jc,
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      mensaje:
        error_jc.response?.data?.mensaje ??
        error_jc.response?.data?.message ??
        'Error al crear el plan de evaluación.',
    };
  }
};

export const actualizarPlan_jc = async (idPlan_jc, datos_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.put(
      `/control-estudios/planes-evaluacion/${idPlan_jc}`,
      datos_jc,
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      mensaje:
        error_jc.response?.data?.mensaje ??
        error_jc.response?.data?.message ??
        'Error al actualizar el plan.',
    };
  }
};

export const publicarPlan_jc = async (idPlan_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.patch(
      `/control-estudios/planes-evaluacion/${idPlan_jc}/publicar`,
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      mensaje: error_jc.response?.data?.mensaje ?? 'Error al publicar el plan.',
    };
  }
};

export const eliminarPlan_jc = async (idPlan_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.delete(
      `/control-estudios/planes-evaluacion/${idPlan_jc}`,
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      mensaje: error_jc.response?.data?.mensaje ?? 'Error al eliminar el plan.',
    };
  }
};

/** Diccionario de datos del módulo vía information_schema (metadatos). */
export const obtenerMetadatos_jc = async () => {
  const respuesta_jc = await apiCliente_ahbb.get(
    '/control-estudios/planes-evaluacion/metadatos',
  );
  return respuesta_jc.data;
};

// ─── Carga de Notas (Docente UI) ──────────────────────────────

export const obtenerMateriasConInscritos_jc = async (idPeriodo_jc) => {
  const respuesta_jc = await apiCliente_ahbb.get(
    `/control-estudios/calificaciones/materias/${idPeriodo_jc}`,
  );
  return respuesta_jc.data;
};

/** Matriz dinámica: columnas según el plan vigente, filas por alumno. */
export const obtenerMatrizNotas_jc = async (idMateria_jc, idPeriodo_jc) => {
  const respuesta_jc = await apiCliente_ahbb.get(
    `/control-estudios/calificaciones/matriz/${idMateria_jc}/${idPeriodo_jc}`,
  );
  return respuesta_jc.data;
};

export const guardarNotas_jc = async (datos_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.post(
      '/control-estudios/calificaciones',
      datos_jc,
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    const detalle_jc = extraerError_jc(error_jc, 'Error al guardar las notas.');
    return { exito: false, ...detalle_jc };
  }
};

/** Notas del alumno autenticado en un período (vista "Mis Notas"). */
export const obtenerMisNotas_jc = async (idPeriodo_jc) => {
  const respuesta_jc = await apiCliente_ahbb.get(
    `/control-estudios/calificaciones/mis-notas/${idPeriodo_jc}`,
  );
  return respuesta_jc.data;
};

export const cerrarActa_jc = async (idMateria_jc, idPeriodo_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.post(
      `/control-estudios/calificaciones/cerrar-acta/${idMateria_jc}/${idPeriodo_jc}`,
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    const detalle_jc = extraerError_jc(error_jc, 'Error al cerrar el acta.');
    return { exito: false, ...detalle_jc };
  }
};

// ─── Actas PDF y reportes ─────────────────────────────────────

/** Descarga el acta (BLANCA o VERDE) y la abre en una pestaña nueva. */
export const descargarActaPdf_jc = async (idMateria_jc, idPeriodo_jc, tipo_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.get(
      `/control-estudios/actas/${idMateria_jc}/${idPeriodo_jc}/pdf`,
      { params: { tipo: tipo_jc }, responseType: 'blob' },
    );
    const blob_jc = new Blob([respuesta_jc.data], { type: 'application/pdf' });
    window.open(window.URL.createObjectURL(blob_jc), '_blank');
    return true;
  } catch {
    return false;
  }
};

export const obtenerRegistroActas_jc = async () => {
  const respuesta_jc = await apiCliente_ahbb.get('/control-estudios/actas');
  return respuesta_jc.data;
};

/** Reporte de rendimiento del período (tabla temporal en PostgreSQL). */
export const obtenerReporteRendimiento_jc = async (idPeriodo_jc) => {
  const respuesta_jc = await apiCliente_ahbb.get(
    `/control-estudios/actas/reporte-rendimiento/${idPeriodo_jc}`,
  );
  return respuesta_jc.data;
};

// ─── Carga Masiva ETL/CSV ─────────────────────────────────────

const enviarCsv_jc = async (entidad_jc, archivo_jc, fase_jc) => {
  const formulario_jc = new FormData();
  formulario_jc.append('file', archivo_jc);
  try {
    const respuesta_jc = await apiCliente_ahbb.post(
      `/control-estudios/csv/${entidad_jc}/${fase_jc}`,
      formulario_jc,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      errores: [
        error_jc.response?.data?.mensaje ??
          error_jc.response?.data?.message ??
          'Error al procesar el archivo CSV.',
      ],
      advertencias: [],
      totalFilas: 0,
      procesadas: 0,
    };
  }
};

export const validarCsv_jc = (entidad_jc, archivo_jc) =>
  enviarCsv_jc(entidad_jc, archivo_jc, 'validar');

export const confirmarCsv_jc = (entidad_jc, archivo_jc) =>
  enviarCsv_jc(entidad_jc, archivo_jc, 'confirmar');

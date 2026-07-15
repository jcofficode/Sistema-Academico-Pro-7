/**
 * academicoServicio_cjgp.js — Consumo del módulo académico (Épicas 1-3).
 * Peticiones asíncronas con Axios hacia la API REST de NestJS.
 */
import { apiCliente_ahbb } from './api_ahbb';

/**
 * El filtro global del backend anida las respuestas de error estructuradas
 * (ej. { mensaje, violaciones }) dentro de data.mensaje. Este helper las
 * aplana para que las vistas siempre reciban strings y arreglos limpios.
 */
const extraerError_cjgp = (error_cjgp, mensajePorDefecto_cjgp) => {
  const cuerpo_cjgp = error_cjgp.response?.data;
  const anidado_cjgp =
    typeof cuerpo_cjgp?.mensaje === 'object' && cuerpo_cjgp?.mensaje !== null
      ? cuerpo_cjgp.mensaje
      : cuerpo_cjgp;

  return {
    mensaje:
      (typeof anidado_cjgp?.mensaje === 'string' && anidado_cjgp.mensaje) ||
      (typeof cuerpo_cjgp?.mensaje === 'string' && cuerpo_cjgp.mensaje) ||
      anidado_cjgp?.message ||
      mensajePorDefecto_cjgp,
    violaciones: anidado_cjgp?.violaciones ?? [],
    errores: anidado_cjgp?.errores ?? [],
  };
};

// ─── Carreras y Pensums (Épica 1) ─────────────────────────────

export const obtenerCarreras_cjgp = async () => {
  const respuesta_cjgp = await apiCliente_ahbb.get('/academico/carreras');
  return respuesta_cjgp.data;
};

export const obtenerDetalleCarrera_cjgp = async (idCarrera_cjgp) => {
  const respuesta_cjgp = await apiCliente_ahbb.get(
    `/academico/carreras/${idCarrera_cjgp}`,
  );
  return respuesta_cjgp.data;
};

/** Guarda la carrera completa creada en el asistente (transaccional). */
export const crearCarreraCompleta_cjgp = async (datos_cjgp) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.post(
      '/academico/carreras',
      datos_cjgp,
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    const detalle_cjgp = extraerError_cjgp(
      error_cjgp,
      'Error al registrar la carrera.',
    );
    return { exito: false, ...detalle_cjgp };
  }
};

/** Asigna (o retira, con null) el profesor que dicta una materia. */
export const asignarProfesorMateria_cjgp = async (idMateria_cjgp, idProfesor_cjgp) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.patch(
      `/academico/carreras/materias/${idMateria_cjgp}/profesor`,
      { id_profesor_cjgp: idProfesor_cjgp },
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    const detalle_cjgp = extraerError_cjgp(
      error_cjgp,
      'No se pudo asignar el profesor.',
    );
    return { exito: false, ...detalle_cjgp };
  }
};

export const eliminarCarrera_cjgp = async (idCarrera_cjgp) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.delete(
      `/academico/carreras/${idCarrera_cjgp}`,
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    return {
      exito: false,
      mensaje: error_cjgp.response?.data?.mensaje ?? 'Error al eliminar la carrera.',
    };
  }
};

/** "Botón mágico": envía el Excel y recibe el pensum interpretado (sin persistir). */
export const analizarPensumExcel_cjgp = async (archivo_cjgp) => {
  const formulario_cjgp = new FormData();
  formulario_cjgp.append('file', archivo_cjgp);
  try {
    const respuesta_cjgp = await apiCliente_ahbb.post(
      '/academico/carreras/pensum-excel/analizar',
      formulario_cjgp,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    return {
      exito: false,
      materias: [],
      errores: [
        error_cjgp.response?.data?.mensaje ??
          error_cjgp.response?.data?.message ??
          'No se pudo interpretar el archivo Excel.',
      ],
    };
  }
};

/**
 * Descarga la plantilla Excel del pensum según el régimen elegido
 * (SEMESTRAL o TRIMESTRAL): el ejemplo se adapta a los bloques del régimen.
 */
export const descargarPlantillaPensum_cjgp = async (regimen_cjgp = 'SEMESTRAL') => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.get(
      '/academico/carreras/plantilla-pensum',
      { params: { regimen: regimen_cjgp }, responseType: 'blob' },
    );
    const url_cjgp = window.URL.createObjectURL(new Blob([respuesta_cjgp.data]));
    const enlace_cjgp = document.createElement('a');
    enlace_cjgp.href = url_cjgp;
    enlace_cjgp.download = `Plantilla_Pensum_${regimen_cjgp}.xlsx`;
    enlace_cjgp.click();
    window.URL.revokeObjectURL(url_cjgp);
    return true;
  } catch {
    return false;
  }
};

// ─── Períodos académicos ──────────────────────────────────────

export const obtenerPeriodos_cjgp = async () => {
  const respuesta_cjgp = await apiCliente_ahbb.get('/academico/periodos');
  return respuesta_cjgp.data;
};

export const obtenerPeriodoActivo_cjgp = async () => {
  const respuesta_cjgp = await apiCliente_ahbb.get('/academico/periodos/activo');
  return respuesta_cjgp.data;
};

export const crearPeriodo_cjgp = async (datos_cjgp) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.post(
      '/academico/periodos',
      datos_cjgp,
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    return {
      exito: false,
      mensaje:
        error_cjgp.response?.data?.mensaje ??
        error_cjgp.response?.data?.message ??
        'Error al crear el período.',
    };
  }
};

export const activarPeriodo_cjgp = async (idPeriodo_cjgp) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.patch(
      `/academico/periodos/${idPeriodo_cjgp}/activar`,
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    return {
      exito: false,
      mensaje: error_cjgp.response?.data?.mensaje ?? 'Error al activar el período.',
    };
  }
};

export const eliminarPeriodo_cjgp = async (idPeriodo_cjgp) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.delete(
      `/academico/periodos/${idPeriodo_cjgp}`,
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    return {
      exito: false,
      mensaje: error_cjgp.response?.data?.mensaje ?? 'Error al eliminar el período.',
    };
  }
};

// ─── Vistas del PROFESOR (materias asignadas) ─────────────────

/** Materias que el profesor autenticado dicta + inscritos del período activo. */
export const obtenerMisMateriasProfesor_cjgp = async () => {
  const respuesta_cjgp = await apiCliente_ahbb.get(
    '/academico/carreras/mis-materias',
  );
  return respuesta_cjgp.data;
};

/** Historial docente: materias dictadas por período con sus resultados. */
export const obtenerHistorialMisMaterias_cjgp = async () => {
  const respuesta_cjgp = await apiCliente_ahbb.get(
    '/academico/carreras/mis-materias/historial',
  );
  return respuesta_cjgp.data;
};

// ─── Inscripción en nombre del alumno (ADMINISTRADOR) ─────────

/** Vitrina de un alumno vista por el admin (mismo Motor de Reglas). */
export const obtenerVitrinaAdmin_cjgp = async (idUsuario_cjgp, idCarrera_cjgp) => {
  const respuesta_cjgp = await apiCliente_ahbb.get(
    `/academico/inscripcion-materias/vitrina-admin/${idUsuario_cjgp}/${idCarrera_cjgp}`,
  );
  return respuesta_cjgp.data;
};

/** El admin inscribe materias en nombre del alumno (auditado por el Guardián). */
export const inscribirMateriasAdmin_cjgp = async (
  idUsuario_cjgp,
  idCarrera_cjgp,
  idPeriodo_cjgp,
  idsMaterias_cjgp,
) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.post(
      `/academico/inscripcion-materias/admin/${idUsuario_cjgp}/${idCarrera_cjgp}`,
      { id_periodo_cjgp: idPeriodo_cjgp, idsMaterias_cjgp },
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    const detalle_cjgp = extraerError_cjgp(
      error_cjgp,
      'No fue posible procesar la inscripción.',
    );
    return { exito: false, ...detalle_cjgp };
  }
};

// ─── Vitrina e Inscripción del alumno (Épica 3) ───────────────

export const obtenerVitrina_cjgp = async (idCarrera_cjgp) => {
  const respuesta_cjgp = await apiCliente_ahbb.get(
    `/academico/inscripcion-materias/vitrina/${idCarrera_cjgp}`,
  );
  return respuesta_cjgp.data;
};

export const inscribirMaterias_cjgp = async (
  idCarrera_cjgp,
  idPeriodo_cjgp,
  idsMaterias_cjgp,
) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.post(
      `/academico/inscripcion-materias/${idCarrera_cjgp}`,
      { id_periodo_cjgp: idPeriodo_cjgp, idsMaterias_cjgp },
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    const detalle_cjgp = extraerError_cjgp(
      error_cjgp,
      'No fue posible procesar la inscripción.',
    );
    return { exito: false, ...detalle_cjgp };
  }
};

export const obtenerHistorialMaterias_cjgp = async () => {
  const respuesta_cjgp = await apiCliente_ahbb.get(
    '/academico/inscripcion-materias/historial',
  );
  return respuesta_cjgp.data;
};

export const retirarMateria_cjgp = async (idInscripcion_cjgp) => {
  try {
    const respuesta_cjgp = await apiCliente_ahbb.delete(
      `/academico/inscripcion-materias/${idInscripcion_cjgp}`,
    );
    return respuesta_cjgp.data;
  } catch (error_cjgp) {
    return {
      exito: false,
      mensaje: error_cjgp.response?.data?.mensaje ?? 'Error al retirar la materia.',
    };
  }
};

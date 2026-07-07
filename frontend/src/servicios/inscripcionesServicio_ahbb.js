import { apiCliente_ahbb } from './api_ahbb';

export const obtenerInscripciones_ahbb = async () => {
  const respuesta_ahbb = await apiCliente_ahbb.get('/inscripciones');
  return respuesta_ahbb.data;
};

export const obtenerInscripcionesPorProfesor_ahbb = async (profesorId_ahbb) => {
  const respuesta_ahbb = await apiCliente_ahbb.get(
    `/inscripciones/profesor/${profesorId_ahbb}`,
  );
  return respuesta_ahbb.data;
};

export const obtenerInscripcionesPorAlumno_ahbb = async (alumnoId_ahbb) => {
  const respuesta_ahbb = await apiCliente_ahbb.get(
    `/inscripciones/historial/${alumnoId_ahbb}`,
  );
  return respuesta_ahbb.data;
};

export const obtenerInscripcionesPorCurso_ahbb = async (cursoId_ahbb) => {
  const respuesta_ahbb = await apiCliente_ahbb.get(
    `/inscripciones/curso/${cursoId_ahbb}`,
  );
  return respuesta_ahbb.data;
};

export const verificarDisponibilidadCurso_ahbb = async (cursoId_ahbb) => {
  const respuesta_ahbb = await apiCliente_ahbb.get(
    `/cursos/${cursoId_ahbb}/disponibilidad`,
  );
  return respuesta_ahbb.data;
};

export const crearInscripcion_ahbb = async (datos_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.post('/inscripciones', {
      id_usuario_inscripcion_ahbb:
        datos_ahbb.id_usuario_inscripcion_ahbb ?? datos_ahbb.alumnoId,
      id_curso_inscripcion_ahbb:
        datos_ahbb.id_curso_inscripcion_ahbb ?? datos_ahbb.cursoId,
      observaciones_ahbb: datos_ahbb.observaciones_ahbb ?? datos_ahbb.observaciones,
    });
    return {
      exito: true,
      inscripcion: respuesta_ahbb.data,
      mensaje: 'Inscripción exitosa',
    };
  } catch (error_ahbb) {
    return {
      exito: false,
      inscripcion: null,
      mensaje: error_ahbb.response?.data?.message ?? 'Error al crear inscripción.',
      payload: error_ahbb.response?.data?.payload ?? null,
    };
  }
};

export const actualizarEstadoInscripcion_ahbb = async (
  inscripcionId_ahbb,
  nuevoEstado_ahbb
) => {
  try {
    await apiCliente_ahbb.patch(`/inscripciones/${inscripcionId_ahbb}/estado`, {
      estatus_ahbb: nuevoEstado_ahbb
    });
    return true;
  } catch {
    return false;
  }
};

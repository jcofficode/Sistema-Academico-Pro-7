import { apiCliente_ahbb } from './api_ahbb';

const mapearPayloadCursoApi_ahbb = (datosCurso_ahbb) => {
  return {
    nombre_ahbb: datosCurso_ahbb.nombre,
    tematica_ahbb: datosCurso_ahbb.descripcion || datosCurso_ahbb.nombre,
    descripcion_ahbb: datosCurso_ahbb.descripcion,
    temarioTexto_ahbb: datosCurso_ahbb.temario,
    fechaInicio_ahbb: datosCurso_ahbb.fechaInicio && datosCurso_ahbb.fechaInicio.trim() !== ''
      ? datosCurso_ahbb.fechaInicio
      : new Date().toISOString(),
    horasDefinidas_ahbb: Number(datosCurso_ahbb.duracionHoras ?? 0),
    topeEstudiantes_ahbb: Number(datosCurso_ahbb.topeEstudiantes ?? 5),
    id_curso_curso_ahbb: datosCurso_ahbb.tienePrelacion
      ? datosCurso_ahbb.prelacionCursoId
      : null,
    id_usuario_curso_ahbb: datosCurso_ahbb.profesorId ?? undefined,
    horarios_ahbb: (datosCurso_ahbb.dias ?? []).map((dia_ahbb) => ({
      diaSemana_ahbb: dia_ahbb,
      horaInicio_ahbb: datosCurso_ahbb.horaInicio,
      horaFin_ahbb: datosCurso_ahbb.horaFin,
    })),
    mensajeCorreccion_ahbb: datosCurso_ahbb.mensajeCorreccion ?? undefined,
  };
};

export const obtenerCursos_ahbb = async (filtros_ahbb = {}) => {
  const { solo_propios, solo_inscritos } = filtros_ahbb;
  const params_ahbb = {};
  if (solo_propios !== undefined) params_ahbb.solo_propios = !!solo_propios;
  if (solo_inscritos !== undefined) params_ahbb.solo_inscritos = !!solo_inscritos;

  const respuesta_ahbb = await apiCliente_ahbb.get('/cursos', { params: params_ahbb });
  return respuesta_ahbb.data;
};

export const obtenerCursoPorId_ahbb = async (id_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.get(`/cursos/${id_ahbb}`);
    return respuesta_ahbb.data;
  } catch {
    return null;
  }
};

export const crearCurso_ahbb = async (datosCurso_ahbb) => {
  try {
      const respuesta_ahbb = await apiCliente_ahbb.post(
        '/cursos',
        mapearPayloadCursoApi_ahbb(datosCurso_ahbb),
      );
      return respuesta_ahbb.data;
  } catch {
    return null;
  }
};

export const actualizarCurso_ahbb = async (id_ahbb, datosCurso_ahbb) => {
 try{
    const respuesta_ahbb = await apiCliente_ahbb.put(`/cursos/${id_ahbb}`, mapearPayloadCursoApi_ahbb(datosCurso_ahbb));
    return respuesta_ahbb.data;
 } catch {
  return null;
 }
};

export const eliminarCurso_ahbb = async (id_ahbb) => {
  try {
    const respuesta = await apiCliente_ahbb.delete(`/cursos/${id_ahbb}`);
    return respuesta.data;
  } catch {
    return { exito: false, mensaje: 'Error al intentar eliminar el curso' };
  }
};

export const evaluarCurso_ahbb = async (id_ahbb, estado_ahbb, motivo_ahbb = '') => {
  try {
    const respuesta = await apiCliente_ahbb.patch(`/cursos/${id_ahbb}/evaluar-curso`, {
      estado: estado_ahbb,
      motivo: motivo_ahbb || undefined,
    });
    return respuesta.data;
  } catch {
    return { exito: false, mensaje: 'Error al evaluar el curso' };
  }
};

export const obtenerSesiones_ahbb = async (filtros_ahbb = {}) => {
  const { id_usuario_ahbb, rol, id_curso_ahbb } = filtros_ahbb;
  const params_ahbb = {};
  if (id_usuario_ahbb) params_ahbb.id_usuario_ahbb = id_usuario_ahbb;
  if (rol) params_ahbb.rol = rol;
  if (id_curso_ahbb) params_ahbb.id_curso_ahbb = id_curso_ahbb;

  const respuesta_ahbb = await apiCliente_ahbb.get('/cursos/sesiones', { params: params_ahbb });
  return respuesta_ahbb.data;
};

export const inicializarCursos_ahbb = async () => {
  return obtenerCursos_ahbb();
};

export const actualizarImagenCertificadoCurso_ahbb = async (
  idCurso_ahbb,
  imagenBase64_ahbb,
) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.patch(
      `/cursos/${idCurso_ahbb}/imagen-certificado`,
      { imagenBase64: imagenBase64_ahbb },
    );
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    return {
      exito: false,
      mensaje:
        error_ahbb.response?.data?.message ??
        'Error al actualizar la imagen del certificado.',
    };
  }
};

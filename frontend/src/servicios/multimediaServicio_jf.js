import { apiCliente_ahbb } from './api_ahbb';

/**
 * Aplana los errores estructurados que el filtro global del backend anida
 * dentro de data.mensaje (ej. { mensaje, errores }), para que las vistas
 * siempre muestren texto legible y nunca "[object Object]".
 */
export const extraerError_jf = (error_jf, mensajePorDefecto_jf) => {
  const cuerpo_jf = error_jf.response?.data;
  const anidado_jf =
    typeof cuerpo_jf?.mensaje === 'object' && cuerpo_jf?.mensaje !== null
      ? cuerpo_jf.mensaje
      : cuerpo_jf;

  return {
    mensaje:
      (typeof anidado_jf?.mensaje === 'string' && anidado_jf.mensaje) ||
      (typeof cuerpo_jf?.mensaje === 'string' && cuerpo_jf.mensaje) ||
      anidado_jf?.message ||
      mensajePorDefecto_jf,
    errores: anidado_jf?.errores ?? [],
  };
};

// ─── CURSOS CONTENIDO ───────────────────────────────────────────

export const obtenerContenidoCurso_jf = async (cursoId) => {
  const respuesta = await apiCliente_ahbb.get(`/multimedia/cursos/${cursoId}/contenido`);
  return respuesta.data;
};

// ─── BLOQUES ──────────────────────────────────────────────────

export const crearBloque_jf = async (datos) => {
  const respuesta = await apiCliente_ahbb.post('/multimedia/bloques', datos);
  return respuesta.data;
};

export const actualizarBloque_jf = async (id, datos) => {
  const respuesta = await apiCliente_ahbb.put(`/multimedia/bloques/${id}`, datos);
  return respuesta.data;
};

export const eliminarBloque_jf = async (id) => {
  const respuesta = await apiCliente_ahbb.delete(`/multimedia/bloques/${id}`);
  return respuesta.data;
};

// ─── LECCIONES ─────────────────────────────────────────────────

export const crearLeccion_jf = async (datos) => {
  const respuesta = await apiCliente_ahbb.post('/multimedia/lecciones', datos);
  return respuesta.data;
};

export const actualizarLeccion_jf = async (id, datos) => {
  const respuesta = await apiCliente_ahbb.put(`/multimedia/lecciones/${id}`, datos);
  return respuesta.data;
};

export const eliminarLeccion_jf = async (id) => {
  const respuesta = await apiCliente_ahbb.delete(`/multimedia/lecciones/${id}`);
  return respuesta.data;
};

// ─── SUBIR VIDEO MULTIPART CON AXIOS PROGRESS ──────────────────

export const subirVideoLeccion_jf = async (id, archivo, alProgresar) => {
  const formData = new FormData();
  formData.append('video', archivo);

  const respuesta = await apiCliente_ahbb.post(
    `/multimedia/lecciones/${id}/subir-video`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (eventoProgreso) => {
        if (alProgresar && eventoProgreso.total) {
          const porcentaje = Math.round((eventoProgreso.loaded * 100) / eventoProgreso.total);
          alProgresar(porcentaje);
        }
      },
    }
  );
  return respuesta.data;
};

// ─── REGISTRAR PROGRESO ────────────────────────────────────────

export const registrarProgresoLeccion_jf = async (id, completada, porcentajeVisto = 100) => {
  const respuesta = await apiCliente_ahbb.post(`/multimedia/lecciones/${id}/progreso`, {
    completada_jf: completada,
    porcentajeVisto_jf: porcentajeVisto,
  });
  return respuesta.data;
};

// ─── EVALUACIONES ──────────────────────────────────────────────

export const guardarEvaluacion_jf = async (datos) => {
  const respuesta = await apiCliente_ahbb.post('/multimedia/evaluaciones', datos);
  return respuesta.data;
};

export const resolverEvaluacion_jf = async (id, respuestas) => {
  const respuesta = await apiCliente_ahbb.post(`/multimedia/evaluaciones/${id}/intentar`, {
    respuestasAlumnoJson_jf: respuestas,
  });
  return respuesta.data;
};

// ─── VIDEOLLAMADAS (SALAS JITSI) ───────────────────────────────

export const obtenerSalasCurso_jf = async (cursoId) => {
  const respuesta = await apiCliente_ahbb.get(`/multimedia/cursos/${cursoId}/salas-videollamadas`);
  return respuesta.data;
};

export const crearSalaVideollamada_jf = async (datos) => {
  const respuesta = await apiCliente_ahbb.post('/multimedia/salas-videollamadas/crear', datos);
  return respuesta.data;
};

export const actualizarEstadoSala_jf = async (id, estado) => {
  const respuesta = await apiCliente_ahbb.patch(`/multimedia/salas-videollamadas/${id}/estado`, { estado });
  return respuesta.data;
};

export const accederASala_jf = async (id) => {
  const respuesta = await apiCliente_ahbb.get(`/multimedia/salas-videollamadas/${id}/acceso`);
  return respuesta.data;
};

import { apiCliente_ahbb } from './api_ahbb';

export const obtenerUsuariosPorRol_ahbb = async (rol_ahbb) => {
  const parametros_ahbb = rol_ahbb ? { params: { rol: rol_ahbb } } : {};
  const respuesta_ahbb = await apiCliente_ahbb.get('/usuarios', parametros_ahbb);
  return respuesta_ahbb.data;
};

export const obtenerProfesoresParaSelect_ahbb = async () => {
  const respuesta = await apiCliente_ahbb.get('/usuarios/profesores');
  return respuesta.data;
};

export const obtenerUsuarioPorId_ahbb = async (id_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.get(`/usuarios/${id_ahbb}`);
    return respuesta_ahbb.data;
  } catch {
    return null;
  }
};

export const actualizarEstadoUsuario_ahbb = async (id_ahbb, estado_ahbb) => {
  try {
    await apiCliente_ahbb.patch(`/usuarios/${id_ahbb}/estado`, {
      estadoCuenta_ahbb: estado_ahbb,
    });
    return true;
  } catch {
    return false;
  }
};

export const actualizarPerfilUsuario_ahbb = async (id_ahbb, datosActualizar_ahbb) => {
  try {
    await apiCliente_ahbb.patch(`/usuarios/${id_ahbb}`, datosActualizar_ahbb);
    return true;
  } catch {
    return false;
  }
};

export const eliminarUsuario_ahbb = async (id_ahbb) => {
  try {
    await apiCliente_ahbb.delete(`/usuarios/${id_ahbb}`);
    return true;
  } catch {
    return false;
  }
};

export const guardarFirmaDigitalUsuario_ahbb = async (id_ahbb, imagenBase64_ahbb) => {
  const respuesta_ahbb = await apiCliente_ahbb.post(
    `/usuarios/${id_ahbb}/firma-digital`,
    { imagenBase64_ahbb },
  );
  return respuesta_ahbb.data;
};

export const procesarCargaMasivaExcel_ahbb = async (archivoExcel_ahbb) => {
  const formData = new FormData();
  formData.append('file', archivoExcel_ahbb);
  
  const respuesta_ahbb = await apiCliente_ahbb.post('/usuarios/carga-masiva/profesores-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return respuesta_ahbb.data;
};

export const exportarProfesoresExcel_ahbb = async () => {
  const respuesta_ahbb = await apiCliente_ahbb.get('/usuarios/carga-masiva/exportar-profesores', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([respuesta_ahbb.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Listado_Profesores.xlsx');
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  return true;
};

// ─── Módulo Inscripciones / Suscripciones de Alumnos ────────────────────────

export const obtenerAlumnosSuscripciones_ahbb = async () => {
  const respuesta_ahbb = await apiCliente_ahbb.get('/usuarios/alumnos-suscripciones');
  return respuesta_ahbb.data;
};

export const obtenerAlumnosPorProfesor_ahbb = async () => {
  const respuesta_ahbb = await apiCliente_ahbb.get('/usuarios/mis-alumnos');
  return respuesta_ahbb.data;
};

export const aprobarAlumno_ahbb = async (id_usuario_ahbb, referenciaPagoMovil_ahbb) => {
  const respuesta_ahbb = await apiCliente_ahbb.post('/usuarios/aprobar-alumno', {
    id_usuario_ahbb,
    referenciaPagoMovil_ahbb,
  });
  return respuesta_ahbb.data;
};

export const aprobarAlumnosMasivo_ahbb = async (ids_ahbb) => {
  const respuesta_ahbb = await apiCliente_ahbb.post('/usuarios/aprobar-alumnos-masivo', {
    ids: ids_ahbb,
  });
  return respuesta_ahbb.data;
};


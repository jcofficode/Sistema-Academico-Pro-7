import { apiCliente_ahbb } from './api_ahbb';

/**
 * Emitir certificado individual
 */
export const emitirCertificado_ahbb = async (idInscripcion_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.post(
      `/certificados/emitir/${idInscripcion_ahbb}`,
    );
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    return {
      exito: false,
      mensaje:
        error_ahbb.response?.data?.mensaje ??
        error_ahbb.response?.data?.message ??
        'Error al emitir certificado.',
    };
  }
};

/**
 * Emitir certificados de forma masiva
 */
export const emitirCertificadosMasivo_ahbb = async (idCurso_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.post(
      `/certificados/emitir-masivo/${idCurso_ahbb}`,
    );
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    return {
      exito: false,
      mensaje:
        error_ahbb.response?.data?.mensaje ??
        error_ahbb.response?.data?.message ??
        'Error al emitir certificados masivos.',
    };
  }
};

/**
 * Obtener certificados del alumno logueado
 */
export const obtenerMisCertificados_ahbb = async (idUsuario_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.get(
      `/certificados/alumno/${idUsuario_ahbb}`,
    );
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    console.error('Error en obtenerMisCertificados_ahbb:', error_ahbb);
    return [];
  }
};

/**
 * Obtener certificados de un curso específico
 */
export const obtenerCertificadosCurso_ahbb = async (idCurso_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.get(
      `/certificados/curso/${idCurso_ahbb}`,
    );
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    console.error('Error en obtenerCertificadosCurso_ahbb:', error_ahbb);
    return [];
  }
};

/**
 * Obtener todos los certificados (Admin)
 */
export const obtenerTodosCertificados_ahbb = async () => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.get('/certificados');
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    console.error('Error en obtenerTodosCertificados_ahbb:', error_ahbb);
    return [];
  }
};

/**
 * Descargar PDF de un certificado
 */
export const descargarPdfCertificado_ahbb = async (idCertificado_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.get(
      `/certificados/${idCertificado_ahbb}/pdf`,
      { responseType: 'blob' },
    );
    const blob_ahbb = new Blob([respuesta_ahbb.data], {
      type: 'application/pdf',
    });
    const url_ahbb = window.URL.createObjectURL(blob_ahbb);
    window.open(url_ahbb, '_blank');
    return true;
  } catch (error_ahbb) {
    console.error('Error al descargar PDF:', error_ahbb);
    return false;
  }
};

/**
 * Anular un certificado
 */
export const anularCertificado_ahbb = async (idCertificado_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.delete(
      `/certificados/${idCertificado_ahbb}`,
    );
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    return {
      exito: false,
      mensaje:
        error_ahbb.response?.data?.mensaje ?? 'Error al anular certificado.',
    };
  }
};

/**
 * Verificar validez de un certificado (público)
 */
export const verificarCertificado_ahbb = async (idCertificado_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.get(
      `/certificados/verificar/${idCertificado_ahbb}`,
    );
    return respuesta_ahbb.data;
  } catch (error_ahbb) {
    console.error('Error en verificarCertificado_ahbb:', error_ahbb);
    return { valido: false, mensaje: 'Error al conectar con el servidor.' };
  }
};

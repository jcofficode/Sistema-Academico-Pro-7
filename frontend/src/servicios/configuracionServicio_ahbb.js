import { apiCliente_ahbb } from './api_ahbb';

export const obtenerConfiguracion_ahbb = async () => {
  const respuesta_ahbb = await apiCliente_ahbb.get('/configuracion');
  return respuesta_ahbb.data;
};

export const actualizarImagenCertificado_ahbb = async (imagenBase64_ahbb) => {
  try {
    const respuesta_ahbb = await apiCliente_ahbb.put(
      '/configuracion/imagen-certificado',
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

import axios from 'axios';

export const MODO_API_AHBB = true;

export const BASE_URL_API_AHBB =
  import.meta.env.VITE_BASE_URL_API_AHBB ?? 'http://localhost:3000/api';

export const apiCliente_ahbb = axios.create({
  baseURL: BASE_URL_API_AHBB,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiCliente_ahbb.interceptors.request.use(
  (config_ahbb) => {
    const token_ahbb = sessionStorage.getItem('certificaciones_token_ahbb');
    if (token_ahbb && config_ahbb.headers) {
      config_ahbb.headers.Authorization = `Bearer ${token_ahbb}`;
    }
    return config_ahbb;
  },
  (error_ahbb) => Promise.reject(error_ahbb),
);

apiCliente_ahbb.interceptors.response.use(
  (respuesta_ahbb) => respuesta_ahbb,
  (error_ahbb) => {
    const errorData_ahbb = error_ahbb.response?.data;

    // Redirección si la sesión expiró (401), pero NO si es el login
    if (error_ahbb.response?.status === 401 && !error_ahbb.config.url.includes('iniciar-sesion')) {
      console.warn('Sesión expirada o inválida. Redirigiendo al login...');
      sessionStorage.removeItem('certificaciones_token_ahbb');
      localStorage.removeItem('certificaciones_usuario_ahbb');
      window.location.href = '/#/login';
    }

    // Alerta silenciosa para permisos (403)
    if (error_ahbb.response?.status === 403) {
      console.error(
        'Acceso denegado:',
        errorData_ahbb?.mensaje || 'No tienes permisos para esta acción.',
      );
    }

    // Log estructurado para depuración sin "ensuciar" la consola en exceso
    if (error_ahbb.response) {
      const status = error_ahbb.response.status;
      const msg =
        errorData_ahbb?.mensaje ||
        errorData_ahbb?.message ||
        error_ahbb.message;
      console.error(`[API Error ${status}]: ${msg}`);
    } else {
      console.error('[API Network/Unknown Error]:', error_ahbb.message);
    }

    return Promise.reject(error_ahbb);
  },
);

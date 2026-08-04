import { defineBoot } from '#q-app/wrappers';
import axios from 'axios';

/**
 * Instancia global de Axios para Quasar
 * Configura la URL base hacia el backend NestJS (http://localhost:3000/api)
 * e inyecta dinámicamente el token JWT de la sesión del usuario.
 */
const BASE_URL = import.meta.env.VITE_BASE_URL_API_AHBB ?? 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de petición: adjunta el token JWT guardado en sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('certificaciones_token_ahbb');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };

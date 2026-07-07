import { apiCliente_ahbb } from './api_ahbb';

export const obtenerEstadisticasDashboard_ahbb = async () => {
  try {
    const respuesta = await apiCliente_ahbb.get('/dashboard/stats');
    return respuesta.data;
  } catch (error) {
    return null;
  }
};

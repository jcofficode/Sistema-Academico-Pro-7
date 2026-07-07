/**
 * useAutoRefresh_ahbb
 *
 * Composable reutilizable para polling reactivo.
 * Ejecuta `callback` inmediatamente al montarse y luego cada `intervaloMs`.
 * Limpia el intervalo automáticamente al desmontar el componente.
 *
 * @param {() => Promise<void>} callback  - Función async a ejecutar periódicamente.
 * @param {number} intervaloMs            - Intervalo en milisegundos (default: 30000).
 * @param {boolean} ejecutarAlMontar      - Si debe ejecutarse inmediatamente (default: true).
 */
import { onMounted, onUnmounted } from 'vue';

export function useAutoRefresh_ahbb(callback, intervaloMs = 30_000, ejecutarAlMontar = true) {
  let timerId = null;

  const iniciar_ahbb = () => {
    if (ejecutarAlMontar) {
      void callback();
    }
    timerId = setInterval(() => void callback(), intervaloMs);
  };

  const detener_ahbb = () => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  onMounted(iniciar_ahbb);
  onUnmounted(detener_ahbb);

  return { iniciar_ahbb, detener_ahbb };
}

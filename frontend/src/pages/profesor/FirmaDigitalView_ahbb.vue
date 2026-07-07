<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import FirmaDigitalPad_ahbb from '../../components/profesor/FirmaDigitalPad_ahbb.vue';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import { guardarFirmaDigitalUsuario_ahbb } from '../../servicios/usuariosServicio_ahbb';

const $q_ahbb = useQuasar();
const route_ahbb = useRoute();
const router_ahbb = useRouter();
const autenticacionStore_ahbb = useAutenticacionStore_ahbb();

const guardarFirma_ahbb = async (imagenBase64_ahbb) => {
  try {
    const respuesta_ahbb = await guardarFirmaDigitalUsuario_ahbb(
      autenticacionStore_ahbb.usuarioActivo_ahbb.id,
      imagenBase64_ahbb,
    );

    if (!respuesta_ahbb.exito) {
      $q_ahbb.notify({
        type: 'negative',
        message: respuesta_ahbb.mensaje ?? 'No se pudo guardar la firma.',
      });
      return;
    }

    // Actualizar la firma en la sesión activa del frontend
    autenticacionStore_ahbb.actualizarFirmaEnSesion_ahbb(
      respuesta_ahbb.rutaFirma_ahbb,
    );

    $q_ahbb.notify({
      type: 'positive',
      message: 'Firma digital guardada correctamente.',
    });

    // Validar si existe una ruta de retorno
    const rutaRetorno_ahbb = route_ahbb.query.redirect;
    if (rutaRetorno_ahbb) {
      $q_ahbb.notify({
        color: 'info',
        message: 'Redirigiendo de vuelta a la gestión de inscripciones...',
        icon: 'reply',
        timeout: 2000,
      });
      setTimeout(() => {
        router_ahbb.push(rutaRetorno_ahbb);
      }, 1500);
    }
  } catch {
    $q_ahbb.notify({
      type: 'negative',
      message: 'Ocurrió un error al guardar la firma digital.',
    });
  }
};
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-primary">Firma digital</div>
        <div class="text-caption text-grey-7">
          Captura la firma del profesor para certificados y constancias.
        </div>
      </div>
    </div>

    <FirmaDigitalPad_ahbb @guardar="guardarFirma_ahbb" />
  </div>
</template>

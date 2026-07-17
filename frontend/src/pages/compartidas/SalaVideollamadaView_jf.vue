<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { accederASala_jf } from '../../servicios/multimediaServicio_jf';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const salaId = Number(route.params.id);
const cargando = ref(true);
const tituloSala = ref('Clase en Vivo');
const jitsiAPI = ref(null);

const cargarScriptJitsi = () => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de Jitsi.'));
    document.head.appendChild(script);
  });
};

const inicializarSala = async () => {
  try {
    // 1. Validar acceso en backend y obtener datos
    const acceso = await accederASala_jf(salaId);
    tituloSala.value = acceso.titulo;

    // 2. Cargar script de Jitsi
    await cargarScriptJitsi();

    // 3. Crear el IFrame de Jitsi Meet
    const container = document.querySelector('#jitsi-container');
    if (!container) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: acceso.nombreSala,
      width: '100%',
      height: '100%',
      parentNode: container,
      userInfo: {
        email: acceso.usuario.correo,
        displayName: acceso.usuario.nombreCompleto,
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        prejoinPageEnabled: false, // Omitir pre-pantalla para entrada directa
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
        ],
      }
    };

    jitsiAPI.value = new window.JitsiMeetExternalAPI(domain, options);

    // Agregar callback de fin
    jitsiAPI.value.addEventListener('readyToClose', () => {
      salirDeSala();
    });

    cargando.value = false;
  } catch (error) {
    console.error('Error al inicializar videollamada:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.mensaje || 'No tienes autorización para acceder a esta videollamada.',
    });
    router.go(-1); // Regresar a la pantalla anterior
  }
};

const salirDeSala = () => {
  if (jitsiAPI.value) {
    jitsiAPI.value.dispose();
  }
  router.go(-1);
};

onMounted(inicializarSala);

onBeforeUnmount(() => {
  if (jitsiAPI.value) {
    jitsiAPI.value.dispose();
  }
});
</script>

<template>
  <q-page class="column no-wrap bg-dark relative-position" style="height: calc(100vh - 50px)">
    <!-- Header de control -->
    <div class="row items-center justify-between q-px-lg q-py-sm bg-blue-grey-10 text-white shadow-2 z-max">
      <div class="row items-center q-gap-md">
        <q-icon name="live_tv" color="negative" size="sm" class="pulse-icon" />
        <div class="text-subtitle1 text-weight-bold ellipsis" style="max-width: 500px">
          {{ tituloSala }}
        </div>
      </div>
      <q-btn
        unelevated
        color="negative"
        icon="call_end"
        label="Salir de la Reunión"
        class="rounded-lg text-weight-bold"
        @click="salirDeSala"
      />
    </div>

    <!-- Contenedor del IFrame de Jitsi -->
    <div class="col relative-position overflow-hidden bg-black">
      <div v-if="cargando" class="absolute-center text-center text-white">
        <q-spinner-grid color="primary" size="60px" />
        <div class="text-h6 q-mt-md">Conectando con el servidor multimedia...</div>
      </div>
      <div id="jitsi-container" class="full-width full-height"></div>
    </div>
  </q-page>
</template>

<style scoped>
.z-max {
  z-index: 1000;
}
.rounded-lg {
  border-radius: 10px;
}
.pulse-icon {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}
.q-gap-md {
  gap: 12px;
}
</style>

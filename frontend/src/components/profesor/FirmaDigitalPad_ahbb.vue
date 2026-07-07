<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const emit = defineEmits(['guardar']);

const canvasFirma_ahbb = ref(null);
const dibujando_ahbb = ref(false);
const contexto_ahbb = ref(null);
const tuvoTrazo_ahbb = ref(false);
const puntosSuavizados_ahbb = ref([]);

const ALTO_CANVAS_AHBB = 260;
const ANCHO_FALLBACK_AHBB = 640;
const SUAVIZADO_TRAZO_AHBB = 0.2;
const GROSOR_TRAZO_AHBB = 2.6;
const COLOR_TRAZO_AHBB = '#132238';

const estilosCanvas_ahbb = computed(() => ({
  width: '100%',
  height: `${ALTO_CANVAS_AHBB}px`,
  borderRadius: '16px',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,247,251,0.98) 100%)',
  border: '1px solid rgba(23,43,77,0.12)',
  cursor: 'crosshair',
}));

const configurarContexto_ahbb = () => {
  if (!contexto_ahbb.value) return;

  contexto_ahbb.value.setTransform(1, 0, 0, 1, 0, 0);
  const ratio_ahbb = window.devicePixelRatio || 1;
  contexto_ahbb.value.scale(ratio_ahbb, ratio_ahbb);
  contexto_ahbb.value.lineWidth = GROSOR_TRAZO_AHBB;
  contexto_ahbb.value.lineCap = 'round';
  contexto_ahbb.value.lineJoin = 'round';
  contexto_ahbb.value.strokeStyle = COLOR_TRAZO_AHBB;
  contexto_ahbb.value.fillStyle = COLOR_TRAZO_AHBB;
};

const obtenerPosicion_ahbb = (evento_ahbb) => {
  const rectangulo_ahbb = canvasFirma_ahbb.value.getBoundingClientRect();
  const punto_ahbb = evento_ahbb.touches?.[0] ?? evento_ahbb;
  return {
    x: punto_ahbb.clientX - rectangulo_ahbb.left,
    y: punto_ahbb.clientY - rectangulo_ahbb.top,
  };
};

const suavizarPunto_ahbb = (punto_ahbb) => {
  const puntos_ahbb = puntosSuavizados_ahbb.value;
  const ultimo_ahbb = puntos_ahbb[puntos_ahbb.length - 1];

  if (!ultimo_ahbb) {
    return punto_ahbb;
  }

  return {
    x:
      ultimo_ahbb.x + (punto_ahbb.x - ultimo_ahbb.x) * SUAVIZADO_TRAZO_AHBB,
    y:
      ultimo_ahbb.y + (punto_ahbb.y - ultimo_ahbb.y) * SUAVIZADO_TRAZO_AHBB,
  };
};

const dibujarPuntoInicial_ahbb = (punto_ahbb) => {
  contexto_ahbb.value.beginPath();
  contexto_ahbb.value.arc(
    punto_ahbb.x,
    punto_ahbb.y,
    GROSOR_TRAZO_AHBB / 2,
    0,
    Math.PI * 2,
  );
  contexto_ahbb.value.fill();
};

const dibujarSegmentoSuavizado_ahbb = () => {
  const puntos_ahbb = puntosSuavizados_ahbb.value;

  if (puntos_ahbb.length === 1) {
    dibujarPuntoInicial_ahbb(puntos_ahbb[0]);
    return;
  }

  if (puntos_ahbb.length < 3) {
    const anterior_ahbb = puntos_ahbb[puntos_ahbb.length - 2];
    const actual_ahbb = puntos_ahbb[puntos_ahbb.length - 1];

    contexto_ahbb.value.beginPath();
    contexto_ahbb.value.moveTo(anterior_ahbb.x, anterior_ahbb.y);
    contexto_ahbb.value.lineTo(actual_ahbb.x, actual_ahbb.y);
    contexto_ahbb.value.stroke();
    return;
  }

  const penultimo_ahbb = puntos_ahbb[puntos_ahbb.length - 2];
  const ultimo_ahbb = puntos_ahbb[puntos_ahbb.length - 1];
  const puntoMedio_ahbb = {
    x: (penultimo_ahbb.x + ultimo_ahbb.x) / 2,
    y: (penultimo_ahbb.y + ultimo_ahbb.y) / 2,
  };
  const puntoPrevio_ahbb = puntos_ahbb[puntos_ahbb.length - 3];
  const puntoMedioPrevio_ahbb = {
    x: (puntoPrevio_ahbb.x + penultimo_ahbb.x) / 2,
    y: (puntoPrevio_ahbb.y + penultimo_ahbb.y) / 2,
  };

  contexto_ahbb.value.beginPath();
  contexto_ahbb.value.moveTo(
    puntoMedioPrevio_ahbb.x,
    puntoMedioPrevio_ahbb.y,
  );
  contexto_ahbb.value.quadraticCurveTo(
    penultimo_ahbb.x,
    penultimo_ahbb.y,
    puntoMedio_ahbb.x,
    puntoMedio_ahbb.y,
  );
  contexto_ahbb.value.stroke();
};

const iniciarTrazo_ahbb = (evento_ahbb) => {
  evento_ahbb.preventDefault();
  dibujando_ahbb.value = true;
  tuvoTrazo_ahbb.value = true;
  const puntoInicial_ahbb = obtenerPosicion_ahbb(evento_ahbb);
  puntosSuavizados_ahbb.value = [puntoInicial_ahbb];
  dibujarPuntoInicial_ahbb(puntoInicial_ahbb);
};

const moverTrazo_ahbb = (evento_ahbb) => {
  if (!dibujando_ahbb.value) return;
  evento_ahbb.preventDefault();
  const puntoActual_ahbb = obtenerPosicion_ahbb(evento_ahbb);
  const puntoSuavizado_ahbb = suavizarPunto_ahbb(puntoActual_ahbb);
  puntosSuavizados_ahbb.value.push(puntoSuavizado_ahbb);
  dibujarSegmentoSuavizado_ahbb();
};

const finalizarTrazo_ahbb = () => {
  if (dibujando_ahbb.value && puntosSuavizados_ahbb.value.length >= 2) {
    const penultimo_ahbb =
      puntosSuavizados_ahbb.value[puntosSuavizados_ahbb.value.length - 2];
    const ultimo_ahbb =
      puntosSuavizados_ahbb.value[puntosSuavizados_ahbb.value.length - 1];

    contexto_ahbb.value.beginPath();
    contexto_ahbb.value.moveTo(penultimo_ahbb.x, penultimo_ahbb.y);
    contexto_ahbb.value.lineTo(ultimo_ahbb.x, ultimo_ahbb.y);
    contexto_ahbb.value.stroke();
  }

  dibujando_ahbb.value = false;
  puntosSuavizados_ahbb.value = [];
};

const limpiarFirma_ahbb = () => {
  const canvas_ahbb = canvasFirma_ahbb.value;
  if (!canvas_ahbb || !contexto_ahbb.value) return;

  contexto_ahbb.value.setTransform(1, 0, 0, 1, 0, 0);
  contexto_ahbb.value.clearRect(0, 0, canvas_ahbb.width, canvas_ahbb.height);
  configurarContexto_ahbb();
  contexto_ahbb.value.beginPath();
  dibujando_ahbb.value = false;
  puntosSuavizados_ahbb.value = [];
  tuvoTrazo_ahbb.value = false;
};

const guardarFirma_ahbb = () => {
  if (!tuvoTrazo_ahbb.value) return;
  emit('guardar', canvasFirma_ahbb.value.toDataURL('image/png'));
};

const redimensionarCanvas_ahbb = () => {
  const canvas_ahbb = canvasFirma_ahbb.value;
  if (!canvas_ahbb) return;

  const ratio_ahbb = window.devicePixelRatio || 1;
  const ancho_ahbb = canvas_ahbb.offsetWidth || ANCHO_FALLBACK_AHBB;

  canvas_ahbb.width = ancho_ahbb * ratio_ahbb;
  canvas_ahbb.height = ALTO_CANVAS_AHBB * ratio_ahbb;
  contexto_ahbb.value = canvas_ahbb.getContext('2d');
  configurarContexto_ahbb();

  if (!tuvoTrazo_ahbb.value) {
    contexto_ahbb.value.beginPath();
  }
};

onMounted(() => {
  redimensionarCanvas_ahbb();
  window.addEventListener('resize', redimensionarCanvas_ahbb);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', redimensionarCanvas_ahbb);
});
</script>

<template>
  <q-card flat bordered class="q-pa-md">
    <q-card-section class="q-pa-none q-mb-md">
      <div class="text-h6 text-weight-bold">Firma digital del instructor</div>
      <div class="text-caption text-grey-7">
        Dibuja tu firma en el canvas. Se almacenará en PNG con fondo transparente.
      </div>
    </q-card-section>

    <canvas
      ref="canvasFirma_ahbb"
      :style="estilosCanvas_ahbb"
      @mousedown="iniciarTrazo_ahbb"
      @mousemove="moverTrazo_ahbb"
      @mouseup="finalizarTrazo_ahbb"
      @mouseleave="finalizarTrazo_ahbb"
      @touchstart="iniciarTrazo_ahbb"
      @touchmove="moverTrazo_ahbb"
      @touchend="finalizarTrazo_ahbb"
    />

    <q-card-actions align="right" class="q-px-none q-pt-md">
      <q-btn unelevated color="primary" text-color="white" icon="ink_eraser" label="Limpiar" @click="limpiarFirma_ahbb" />
      <q-btn
        color="primary"
        unelevated
        icon="save"
        label="Guardar firma"
        :disable="!tuvoTrazo_ahbb"
        @click="guardarFirma_ahbb"
      />
    </q-card-actions>
  </q-card>
</template>

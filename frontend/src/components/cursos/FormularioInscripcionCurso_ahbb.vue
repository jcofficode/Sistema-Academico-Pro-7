<script setup>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import {
  crearInscripcion_ahbb,
  verificarDisponibilidadCurso_ahbb,
} from '../../servicios/inscripcionesServicio_ahbb';
import DialogoSolapamiento_ahbb from './DialogoSolapamiento_ahbb.vue';

const props = defineProps({
  curso_ahbb: { type: Object, required: true },
});

const $q_ahbb = useQuasar();
const autenticacionStore_ahbb = useAutenticacionStore_ahbb();
const disponibilidad_ahbb = ref(null);
const enviando_ahbb = ref(false);

const consultarDisponibilidad_ahbb = async () => {
  disponibilidad_ahbb.value = await verificarDisponibilidadCurso_ahbb(
    props.curso_ahbb.id,
    props.curso_ahbb.topeEstudiantes ?? 5,
  );
};

const inscribirse_ahbb = async () => {
  if (!autenticacionStore_ahbb.usuarioActivo_ahbb) return;

  enviando_ahbb.value = true;
  try {
    const resultado_ahbb = await crearInscripcion_ahbb({
      id_usuario_inscripcion_ahbb: autenticacionStore_ahbb.usuarioActivo_ahbb.id,
      id_curso_inscripcion_ahbb: props.curso_ahbb.id,
    });

    if (!resultado_ahbb.exito) {
      if (resultado_ahbb.mensaje === 'SOLAPAMIENTO_DETECTADO') {
        $q_ahbb.dialog({
          component: DialogoSolapamiento_ahbb,
          componentProps: {
            solapamientos: resultado_ahbb.payload?.solapamientos || [],
            huecosDisponibles: resultado_ahbb.payload?.huecosDisponibles || []
          }
        });
      } else {
        $q_ahbb.notify({ type: 'negative', message: resultado_ahbb.mensaje });
      }
      return;
    }

    await consultarDisponibilidad_ahbb();
    $q_ahbb.notify({
      type: 'positive',
      message: 'Inscripción registrada correctamente.',
    });
  } finally {
    enviando_ahbb.value = false;
  }
};

onMounted(() => {
  void consultarDisponibilidad_ahbb();
});
</script>

<template>
  <q-card flat bordered class="q-mt-lg">
    <q-card-section class="row items-start justify-between">
      <div>
        <div class="text-h6 text-weight-bold">Inscripción al curso</div>
        <div class="text-caption text-grey-7">
          Validación en tiempo real de cupos antes de enviar la solicitud.
        </div>
      </div>

      <q-badge
        v-if="disponibilidad_ahbb"
        :color="disponibilidad_ahbb.disponible_ahbb ? 'positive' : 'negative'"
        :label="`${disponibilidad_ahbb.cuposRestantes_ahbb} cupos disponibles`"
      />
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        flat
        color="grey-7"
        icon="refresh"
        label="Actualizar cupos"
        @click="consultarDisponibilidad_ahbb"
      />
      <q-btn
        color="primary"
        unelevated
        icon="school"
        label="Inscribirme"
        :loading="enviando_ahbb"
        :disable="!disponibilidad_ahbb?.disponible_ahbb"
        @click="inscribirse_ahbb"
      />
    </q-card-actions>
  </q-card>
</template>

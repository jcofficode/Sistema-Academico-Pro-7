<!--
  ModalConfirmar_ahbb.vue — Componente 6: QDialog de confirmación
-->
<script setup>
import { ref } from 'vue';

defineProps({
  titulo_ahbb: { type: String, default: undefined },
  mensaje_ahbb: { type: String, default: undefined },
});

const emit = defineEmits(['confirmar', 'cancelar']);

const abierto_ahbb = ref(true);
</script>

<template>
  <q-dialog v-model="abierto_ahbb" persistent @hide="emit('cancelar')">
    <q-card style="min-width: 350px; border-radius: 12px">
      <q-card-section class="text-center q-pt-lg">
        <q-icon name="warning" color="warning" size="3.5rem" />
        <div class="text-h6 text-weight-bold q-mt-sm">
          {{ titulo_ahbb ?? 'Confirmar accion' }}
        </div>
      </q-card-section>

      <q-card-section class="text-center text-grey-7">
        {{ mensaje_ahbb ?? 'Estas seguro de que deseas continuar?' }}
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md">
        <q-btn
          label="Cancelar"
          outline
          color="grey-7"
          v-close-popup
          @click="emit('cancelar')"
        />
        <q-btn
          label="Confirmar"
          color="negative"
          unelevated
          v-close-popup
          @click="emit('confirmar')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

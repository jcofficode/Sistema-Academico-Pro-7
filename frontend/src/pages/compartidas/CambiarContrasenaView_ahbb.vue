<!-- CambiarContrasenaView_ahbb.vue — Cambio de contraseña (compartida) -->
<script setup>
import { ref } from 'vue';

const contrasenaActual_ahbb = ref('');
const nuevaContrasena_ahbb = ref('');
const confirmarContrasena_ahbb = ref('');
</script>

<template>
  <div class="q-pa-md">
    <div class="text-h5 q-mb-md">
      <q-icon name="lock" class="q-mr-sm" />
      Cambiar Contraseña
    </div>

    <q-card flat bordered class="q-pa-lg" style="max-width: 500px">
      <q-form class="q-gutter-md">
        <q-input
          v-model="contrasenaActual_ahbb"
          label="Contraseña actual"
          type="password"
          outlined
          dense
        />
        <q-input
          v-model="nuevaContrasena_ahbb"
          label="Nueva contraseña"
          type="password"
          outlined
          dense
        />
        <q-input
          v-model="confirmarContrasena_ahbb"
          label="Confirmar nueva contraseña"
          type="password"
          outlined
          dense
        />

        <q-btn
          label="Cambiar Contraseña"
          color="primary"
          unelevated
          class="full-width"
          disable
        />

        <div class="text-caption text-grey-6 q-mt-sm">
          Funcionalidad pendiente de conexión con backend.
        </div>
      </q-form>
    </q-card>
  </div>
</template>

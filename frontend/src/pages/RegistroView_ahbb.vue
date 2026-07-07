<!--
  RegistroView_ahbb.vue — Vista de registro con Quasar
-->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../stores/autenticacionStore_ahbb';
import { reglaReferenciaPago_ahbb, validarReferenciaPago_ahbb } from '../constantes/validacionPago_ahbb';

const $q_ahbb = useQuasar();
const router_ahbb = useRouter();
const authStore_ahbb = useAutenticacionStore_ahbb();

const nombre_ahbb = ref('');
const apellido_ahbb = ref('');
const cedula_ahbb = ref('');
const correo_ahbb = ref('');

const cargando_ahbb = ref(false);
const modalMembresiaPlazo_ahbb = ref(false);
const pago_referencia_ahbb = ref('');

const abrirModalMembresia_ahbb = () => {
  // Validamos que todos los campos previos obligatorios estén listos
  if (!nombre_ahbb.value || !apellido_ahbb.value || !cedula_ahbb.value || !correo_ahbb.value) {
    $q_ahbb.notify({ type: 'warning', message: 'Por favor completa todos tus datos personales primero.' });
    return;
  }
  modalMembresiaPlazo_ahbb.value = true;
};

const manejarRegistro_ahbb = async () => {
  const validacion = validarReferenciaPago_ahbb(pago_referencia_ahbb.value);
  if (!validacion.valido) {
    $q_ahbb.notify({ type: 'negative', message: validacion.mensaje });
    return;
  }

  authStore_ahbb.limpiarError_ahbb();
  cargando_ahbb.value = true;
  await new Promise((r) => setTimeout(r, 400));

  // OMITIMOS generar contraseñas aquí, mandaremos una clave generica (que el backend obviará y creará una temporal) 
  // o el backend se encargará de crearla en 'crearUsuario_ahbb' si adaptamos que no sea requerida inicialmente.
  // Mandaremos algo como "temporal123" para pasar la validacion actual de NestJS si la pide.
  const exito_ahbb = await authStore_ahbb.registrarUsuario_ahbb({
    nombre: nombre_ahbb.value,
    apellido: apellido_ahbb.value,
    cedula: cedula_ahbb.value,
    correo: correo_ahbb.value,
    contrasena: "temp12345", // Contraseña temporal requerida por schema, se sobreescribe al ser aprobado por admin
    rol: 'ALUMNO', // Rol por defecto
    referenciaPagoMovil: pago_referencia_ahbb.value,
  });

  cargando_ahbb.value = false;

  if (exito_ahbb) {
    modalMembresiaPlazo_ahbb.value = false;
    $q_ahbb.dialog({
      title: '¡Membresía en Revisión!',
      message: 'Hemos recibido tu solicitud y datos de pago. Tu cuenta está en validación administrativa, muy pronto recibirás un correo con tus accesos.',
      color: 'positive'
    }).onOk(() => {
      void router_ahbb.push({ name: 'login' });
    });
  } else {
     if (authStore_ahbb.errorAuth_ahbb) {
        $q_ahbb.notify({ type: 'negative', message: authStore_ahbb.errorAuth_ahbb });
     }
  }
};
</script>

<template>
  <div class="auth-fondo_ahbb flex flex-center">
    <!-- Botón Volver al Inicio -->
    <q-btn
      round flat
      icon="home"
      color="white"
      to="/"
      size="lg"
      class="absolute-top-left q-mt-md q-ml-md"
      title="Volver al inicio"
    />

    <q-card class="auth-card_ahbb" flat bordered>
      <q-card-section class="text-center q-pb-none">
        <div class="flex flex-center q-mb-xs">
          <img src="/graduation-cap.png" alt="Academia H&B" style="width:60px;height:60px;object-fit:contain;" />
        </div>
        <div class="text-h5 text-weight-bold text-primary q-mt-sm">
          Academia <span class="text-accent">H&B</span>
        </div>
        <p class="text-grey-6 q-mt-sm">Crea tu cuenta para acceder al sistema</p>
      </q-card-section>

      <q-card-section>
        <q-banner
          v-if="authStore_ahbb.errorAuth_ahbb"
          dense
          rounded
          class="bg-negative text-white q-mb-md"
        >
          {{ authStore_ahbb.errorAuth_ahbb }}
        </q-banner>

        <q-form @submit.prevent="abrirModalMembresia_ahbb" class="q-gutter-y-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="nombre_ahbb" label="Nombre" outlined dense :rules="[(v) => !!v || 'Requerido']">
                <template v-slot:prepend><q-icon name="person" /></template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="apellido_ahbb" label="Apellido" outlined dense :rules="[(v) => !!v || 'Requerido']">
                <template v-slot:prepend><q-icon name="person_outline" /></template>
              </q-input>
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="cedula_ahbb" label="Cédula" outlined dense :rules="[(v) => !!v || 'Requerido']">
                <template v-slot:prepend><q-icon name="badge" /></template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="correo_ahbb" label="Correo electrónico" type="email" outlined dense :rules="[(v) => !!v || 'Requerido']">
                <template v-slot:prepend><q-icon name="email" /></template>
              </q-input>
            </div>
          </div>

          <q-btn
            type="submit"
            label="Obtener Membresía"
            color="primary"
            class="full-width"
            size="md"
            unelevated
            icon-right="workspace_premium"
          />
        </q-form>

        <p class="text-center text-grey-6 q-mt-md" style="font-size: 0.9rem">
          ¿Ya tienes cuenta?
          <router-link to="/login" class="text-secondary text-weight-bold">
            Inicia sesión
          </router-link>
        </p>
      </q-card-section>
    </q-card>

    <!-- Modal de Membresía (Paywall) -->
    <q-dialog v-model="modalMembresiaPlazo_ahbb" persistent>
      <q-card style="min-width: 400px; max-width: 500px; border-radius: 12px">
        <q-card-section class="bg-primary text-white text-center q-pb-xl">
           <q-icon name="workspace_premium" size="4rem" color="accent" class="q-mt-md" />
           <div class="text-h4 text-weight-bold q-mt-sm">Membresía Anual</div>
           <div class="text-body1 q-mt-sm">Conviértete en Miembro Oficial</div>
        </q-card-section>

        <!-- Ajuste CSS para montar la tarjeta del precio -->
        <q-card-section class="q-pt-none text-center" style="margin-top: -30px;">
           <q-card bordered flat class="bg-white q-pa-md d-inline-block" style="border-radius: 16px; display: inline-block;">
             <div class="text-h3 text-weight-bolder text-dark">$60<span class="text-h5 text-grey-6">/año</span></div>
           </q-card>
        </q-card-section>

        <q-card-section class="q-px-lg">
          <q-list dense>
            <q-item>
              <q-item-section avatar><q-icon color="positive" name="check_circle" /></q-item-section>
              <q-item-section>Acceso a compra de mercancía oficial</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon color="positive" name="check_circle" /></q-item-section>
              <q-item-section>Cursos de formación ilimitados (Aplica Prelaciones)</q-item-section>
            </q-item>
             <q-item>
              <q-item-section avatar><q-icon color="positive" name="check_circle" /></q-item-section>
              <q-item-section>Certificados avalados internacionalmente</q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 text-grey-8 q-mb-sm text-center">Datos de Pago Móvil para Transferencia:</div>
          <div class="row justify-center q-mb-md">
            <q-badge color="grey-3" text-color="dark" class="q-pa-sm text-weight-bold">
               Banco: 0102 / Telf: 0412-5550199 / RIF: J-1234567-8
            </q-badge>
          </div>

          <q-input
            v-model="pago_referencia_ahbb"
            label="Nro de Operación / Referencia"
            outlined
            placeholder="Ejm: 12345678901234"
            dense
            maxlength="20"
            inputmode="numeric"
            :rules="reglaReferenciaPago_ahbb"
            lazy-rules
          >
             <template v-slot:prepend><q-icon name="receipt" /></template>
             <template v-slot:hint>
               <span class="text-caption">Solo dígitos &bull; Mín. 8 dígitos &bull; Máx. 20 dígitos</span>
             </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="center" class="q-px-lg q-pb-lg">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn 
            unelevated 
            label="Confirmar Pago e Ir" 
            color="primary" 
            @click="manejarRegistro_ahbb" 
            :loading="cargando_ahbb"
            :disable="pago_referencia_ahbb.length < 8"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.auth-fondo_ahbb {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1b2a4a 50%, #1e3a6e 100%);
  padding: 1rem;
}
.auth-card_ahbb {
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
}
</style>

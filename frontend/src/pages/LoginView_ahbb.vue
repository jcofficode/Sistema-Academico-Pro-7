<!--
  LoginView_ahbb.vue — Vista de inicio de sesión con Quasar
-->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAutenticacionStore_ahbb } from '../stores/autenticacionStore_ahbb';
import { PERFILES_DEMO_JC } from '../constantes/perfilesDemo_jc';

const router_ahbb = useRouter();
const authStore_ahbb = useAutenticacionStore_ahbb();

const correo_ahbb = ref('');
const contrasena_ahbb = ref('');
const cargando_ahbb = ref(false);
const mostrarContrasena_ahbb = ref(false);

/** Perfil de demostración seleccionado (solo para resaltarlo en la interfaz). */
const perfilSeleccionado_jc = ref(null);

/**
 * Rellena el formulario con las credenciales del perfil elegido.
 * No inicia sesión: el usuario sigue pulsando "Iniciar Sesión", de modo que el
 * flujo de autenticación es exactamente el mismo que al escribirlas a mano.
 */
const usarPerfilDemo_jc = (perfil_jc) => {
  perfilSeleccionado_jc.value = perfil_jc.rol;
  correo_ahbb.value = perfil_jc.correo;
  contrasena_ahbb.value = perfil_jc.contrasena;
  authStore_ahbb.limpiarError_ahbb();
};

const manejarLogin_ahbb = async () => {
  cargando_ahbb.value = true;
  authStore_ahbb.limpiarError_ahbb();

  await new Promise((r) => setTimeout(r, 400));

  const exito_ahbb = await authStore_ahbb.iniciarSesion_ahbb(
    correo_ahbb.value,
    contrasena_ahbb.value
  );

  cargando_ahbb.value = false;

  if (exito_ahbb) {
    void router_ahbb.push({ name: 'dashboard' });
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
      <!-- Logo -->
      <q-card-section class="text-center q-pb-none">
        <div class="flex flex-center q-mb-xs">
          <img src="/graduation-cap.png" alt="Academia H&B" style="width:60px;height:60px;object-fit:contain;" />
        </div>
        <div class="text-h5 text-weight-bold text-primary q-mt-sm">
          Academia <span class="text-accent">H&B</span>
        </div>
        <p class="text-grey-6 q-mt-sm">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </q-card-section>

      <q-card-section>
        <!-- Error -->
        <q-banner
          v-if="authStore_ahbb.errorAuth_ahbb"
          dense
          rounded
          class="bg-negative text-white q-mb-md"
        >
          {{ authStore_ahbb.errorAuth_ahbb }}
        </q-banner>

        <q-form @submit.prevent="manejarLogin_ahbb" class="q-gutter-y-md">
          <q-input
            v-model="correo_ahbb"
            label="Correo electrónico"
            type="email"
            outlined
            dense
            :rules="[(v) => !!v || 'El correo es requerido']"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="contrasena_ahbb"
            label="Contraseña"
            :type="mostrarContrasena_ahbb ? 'text' : 'password'"
            outlined
            dense
            :rules="[(v) => !!v || 'La contraseña es requerida']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="mostrarContrasena_ahbb ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="mostrarContrasena_ahbb = !mostrarContrasena_ahbb"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Iniciar Sesión"
            color="primary"
            class="full-width"
            size="md"
            :loading="cargando_ahbb"
            unelevated
          />
        </q-form>

        <p class="text-center text-grey-6 q-mt-md" style="font-size: 0.9rem">
          ¿No tienes cuenta?
          <router-link to="/registro" class="text-secondary text-weight-bold">
            Regístrate aquí
          </router-link>
        </p>

        <!-- ── Acceso rápido de evaluación ──────────────────────────
             Rellena el formulario con las credenciales del perfil elegido.
             El inicio de sesión sigue siendo el mismo: se pulsa el botón. -->
        <div class="acceso-rapido_jc q-mt-md">
          <div class="separador_jc">
            <span>Acceso rápido de evaluación</span>
          </div>

          <div class="row q-col-gutter-sm q-mt-xs">
            <div v-for="perfil_jc in PERFILES_DEMO_JC" :key="perfil_jc.rol" class="col-6">
              <q-card
                flat
                bordered
                class="perfil-demo_jc cursor-pointer"
                :class="{ 'perfil-demo--activo_jc': perfilSeleccionado_jc === perfil_jc.rol }"
                @click="usarPerfilDemo_jc(perfil_jc)"
              >
                <q-card-section class="q-pa-sm row items-center no-wrap">
                  <q-avatar
                    :color="perfil_jc.color"
                    text-color="white"
                    :icon="perfil_jc.icono"
                    size="30px"
                  />
                  <div class="q-ml-sm col overflow-hidden">
                    <div class="text-caption text-weight-bold ellipsis">
                      {{ perfil_jc.etiqueta }}
                    </div>
                    <div class="text-grey-6 ellipsis" style="font-size: 0.68rem">
                      {{ perfil_jc.descripcion }}
                    </div>
                  </div>
                  <q-icon
                    v-if="perfilSeleccionado_jc === perfil_jc.rol"
                    name="check_circle"
                    :color="perfil_jc.color"
                    size="18px"
                  />
                </q-card-section>

                <q-tooltip anchor="top middle" self="bottom middle">
                  Entrar como {{ perfil_jc.etiqueta }} · {{ perfil_jc.correo }}
                </q-tooltip>
              </q-card>
            </div>
          </div>

          <p class="text-center text-grey-6 q-mt-sm q-mb-none" style="font-size: 0.72rem">
            <q-icon name="info" size="13px" class="q-mr-xs" />
            Elige un perfil y pulsa <strong>Iniciar Sesión</strong>.
          </p>
        </div>
      </q-card-section>
    </q-card>
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
  max-width: 440px;
  border-radius: 16px;
}

/* ── Acceso rápido de evaluación ─────────────────────────────── */
.separador_jc {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #9e9e9e;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.separador_jc::before,
.separador_jc::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.perfil-demo_jc {
  border-radius: 10px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}
.perfil-demo_jc:hover {
  border-color: #1b2a4a;
  box-shadow: 0 2px 8px rgba(27, 42, 74, 0.14);
  transform: translateY(-1px);
}
.perfil-demo--activo_jc {
  border-color: #1b2a4a;
  background: #f5f7fb;
  box-shadow: inset 0 0 0 1px #1b2a4a;
}
</style>

<!-- PerfilView_ahbb.vue — Página de perfil del usuario bloqueada y actualización de contraseña (compartida entre roles) -->
<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { cambiarContrasenaUsuario_ahbb } from '../../servicios/autenticacionServicio_ahbb';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';

const $q = useQuasar();
const router_ahbb = useRouter();
const authStore_ahbb = useAutenticacionStore_ahbb();

// Variables para el cambio de clave
const contrasenaActual = ref('');
const contrasenaNueva = ref('');
const contrasenaConfirmacion = ref('');
const cargandoClave = ref(false);

const cambiarClave = async () => {
  if (contrasenaNueva.value !== contrasenaConfirmacion.value) {
    $q.notify({ type: 'negative', message: 'La confirmación no coincide con la nueva contraseña.' });
    return;
  }
  if (contrasenaNueva.value.length < 6) {
    $q.notify({ type: 'negative', message: 'La contraseña nueva debe tener al menos 6 caracteres.' });
    return;
  }

  cargandoClave.value = true;
  try {
    await cambiarContrasenaUsuario_ahbb(contrasenaActual.value, contrasenaNueva.value);
    
    // Apagar bandera para el modal obligatorio
    authStore_ahbb.usuarioActivo_ahbb.requiereCambioContrasena = false;
    
    $q.notify({ type: 'positive', message: '¡Contraseña actualizada exitosamente! Gracias por proteger tu cuenta.' });
    
    contrasenaActual.value = '';
    contrasenaNueva.value = '';
    contrasenaConfirmacion.value = '';

    // Persistir el localStorage para que no salte el modal si recargan la página
    localStorage.setItem('certificaciones_usuario_ahbb', JSON.stringify(authStore_ahbb.usuarioActivo_ahbb));

    // Si estaban obligados a cambiarla, los regresamos al dashboard tras cambiarla!
    setTimeout(() => {
      router_ahbb.push({ name: 'dashboard' });
    }, 1500);
    
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Error tratando de actualizar la contraseña.';
    $q.notify({ type: 'negative', message: typeof errorMsg === 'string' ? errorMsg : 'Verifica tu contraseña temporal' });
  } finally {
    cargandoClave.value = false;
  }
};
</script>

<template>
  <div class="q-pa-md">
    <div class="text-h5 q-mb-md">
      <q-icon name="person" class="q-mr-sm" color="primary"/>
      Mi Perfil de Usuario
    </div>

    <!-- Si tiene la alerta activa -->
    <q-banner v-if="authStore_ahbb.usuarioActivo_ahbb?.requiereCambioContrasena" class="bg-warning text-white q-mb-md rounded-borders">
      <template v-slot:avatar>
        <q-icon name="warning" size="md" />
      </template>
      Atención: Requieres un cambio de contraseña vital para interactuar con el resto de la plataforma y salir de esta pantalla.
    </q-banner>

    <div class="row q-col-gutter-lg">
      
      <!-- Columna Izquierda: Datos Personales en Sólo Lectura -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-lg full-height">
          <div class="text-h6 text-primary q-mb-xs">Datos Personales</div>
          <p class="text-caption text-grey-6 q-mb-lg">Por resguardo e integridad de los certificados académicos digitales, la validación de estos datos es estricta (Solo lectura).</p>

          <div class="q-gutter-md">
            <q-input
              :model-value="authStore_ahbb.usuarioActivo_ahbb?.nombre"
              label="Nombre Registrado"
              outlined
              readonly
              dense
            />
            <q-input
              :model-value="authStore_ahbb.usuarioActivo_ahbb?.apellido"
              label="Apellido Registrado"
              outlined
              readonly
              dense
            />
            <q-input
              :model-value="authStore_ahbb.usuarioActivo_ahbb?.cedula"
              label="Cédula"
              outlined
              readonly
              dense
            />
            <q-input
              :model-value="authStore_ahbb.usuarioActivo_ahbb?.correo"
              label="Correo electrónico Oficial"
              outlined
              readonly
              dense
            />
            <div>
              <q-badge
                :color="authStore_ahbb.usuarioActivo_ahbb?.rol === 'administrador' ? 'red' : authStore_ahbb.usuarioActivo_ahbb?.rol === 'profesor' ? 'blue' : 'green'"
                :label="'ROL EN PLATAFORMA: ' + authStore_ahbb.usuarioActivo_ahbb?.rol?.toUpperCase()"
                class="q-pa-sm text-subtitle2"
              />
            </div>
          </div>
        </q-card>
      </div>

      <!-- Columna Derecha: Cambio de Clave -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-lg full-height">
          <div class="text-h6 text-primary q-mb-lg">
            <q-icon name="vpn_key" class="q-mr-xs"/> Actualización de Contraseña
          </div>

          <q-form @submit.prevent="cambiarClave" class="q-gutter-md">
            <q-input 
              v-model="contrasenaActual" 
              dense 
              outlined 
              type="password" 
              label="Contraseña Actual Temporal" 
              placeholder="Ingresa la recibida por el correo"
              required 
            />
            
            <q-input 
              v-model="contrasenaNueva" 
              dense 
              outlined 
              type="password" 
              label="Nueva Contraseña Definitiva" 
              hint="Minímo 6 caracteres" 
              required 
            />
            
            <q-input 
              v-model="contrasenaConfirmacion" 
              dense 
              outlined 
              type="password" 
              label="Confirmar Nueva Contraseña" 
              required 
            />

            <div class="q-mt-xl text-right">
              <q-btn 
                label="Actualizar mi Contraseña" 
                type="submit" 
                color="secondary" 
                icon="save"
                :loading="cargandoClave"
              />
            </div>
          </q-form>
        </q-card>
      </div>

    </div>
  </div>
</template>

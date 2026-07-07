<!-- Componente raíz de la aplicación con layout condicional y menú dinámico por rol -->
<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAutenticacionStore_ahbb } from './stores/autenticacionStore_ahbb';
import { useCursosStore_ahbb } from './stores/cursosStore_ahbb';
import { obtenerMenuPorRol_ahbb } from './constantes/menuSistema_ahbb';
import { obtenerAlumnosSuscripciones_ahbb } from './servicios/usuariosServicio_ahbb';
import { useAutoRefresh_ahbb } from './composables/useAutoRefresh_ahbb';

// Componentes de layout landing
import Navbar_ah from './components/layout/Navbar_ah.vue';
import Footer_ah from './components/layout/Footer_ah.vue';
import BadgeCarrito_ahbb from './components/tienda/BadgeCarrito_ahbb.vue';

const route_ahbb = useRoute();
const router_ahbb = useRouter();
const authStore_ahbb = useAutenticacionStore_ahbb();
const cursosStore_ahbb = useCursosStore_ahbb();

// Inicializar stores (la autenticación se inicializa en onMounted para no bloquear el render)
cursosStore_ahbb.inicializar_ahbb();

/**
 * Detecta el tipo de layout según la meta de la ruta.
 */
const layoutActual_ahbb = computed(() => {
  const defaultLayout_ah = route_ahbb.meta.layout_ahbb || 'landing';
  // Forzar que la tienda se vea como landing (sin panel) si no hay sesión iniciada
  if (defaultLayout_ah === 'sistema' && route_ahbb.meta.publica_ahbb && !authStore_ahbb.estaAutenticado_ahbb) {
    return 'landing';
  }
  return defaultLayout_ah;
});

/**
 * Obtiene los enlaces del menú según el rol del usuario activo.
 */
const enlacesMenu_ahbb = computed(() => {
  const rol_ahbb = authStore_ahbb.usuarioActivo_ahbb?.rol;
  if (!rol_ahbb) return [];
  return obtenerMenuPorRol_ahbb(rol_ahbb);
});

/**
 * Color del badge de rol.
 */
const colorRol_ahbb = computed(() => {
  const rol_ahbb = authStore_ahbb.usuarioActivo_ahbb?.rol;
  if (rol_ahbb === 'administrador') return 'red';
  if (rol_ahbb === 'profesor') return 'blue';
  return 'green';
});

/**
 * Etiqueta legible del rol.
 */
const etiquetaRol_ahbb = computed(() => {
  const rol_ahbb = authStore_ahbb.usuarioActivo_ahbb?.rol;
  if (rol_ahbb === 'administrador') return 'Admin';
  if (rol_ahbb === 'profesor') return 'Profesor';
  if (rol_ahbb === 'alumno') return 'Alumno';
  return '';
});

/**
 * Cierra la sesión y redirige al login.
 */
const cerrarSesion_ahbb = () => {
  authStore_ahbb.cerrarSesion_ahbb();
  void router_ahbb.push({ name: 'inicio' }); // redirigir a la landing page
};

/**
 * Propiedad para decidir si mostrar el Dialog obligatorio de cambio
 */
const mostrarAlertaCambioClave_ahbb = computed(() => {
  return layoutActual_ahbb.value === 'sistema' && 
         authStore_ahbb.usuarioActivo_ahbb?.requiereCambioContrasena && 
         route_ahbb.name !== 'perfil';
});

const irAlPerfil_ahbb = () => {
  router_ahbb.push({ name: 'perfil' });
};

/**
 * Control del menú lateral
 */
const menuLateralAbierto_ahbb = ref(false);
const alternarMenuLateral_ahbb = () => {
  menuLateralAbierto_ahbb.value = !menuLateralAbierto_ahbb.value;
};

/**
 * Contadores de notificaciones (solo Admin)
 */
const pendientes_ahbb = ref({
  alumnos: 0,
  cursos: 0,
});

const cargarContadoresAdmin_ahbb = async () => {
  if (!authStore_ahbb.esAdministrador_ahbb) return;
  try {
    // 1. Alumnos pendientes
    const alumnos = await obtenerAlumnosSuscripciones_ahbb();
    pendientes_ahbb.value.alumnos = alumnos.filter(a => a.estadoCuenta === 'PENDIENTE_APROBACION').length;
    
    // 2. Cursos pendientes
    // Aseguramos que los cursos estén cargados en el store
    await cursosStore_ahbb.inicializar_ahbb();
    pendientes_ahbb.value.cursos = cursosStore_ahbb.listaCursos_ahbb.filter(c => c.estadoAprobacion === 'PENDIENTE').length;
  } catch (error) {
    console.error('Error cargando contadores admin:', error);
  }
};

// Refrescar badges al cambiar de ruta (ej: volver de Cursos o Inscripciones)
watch(
  () => route_ahbb.path,
  async () => {
    await cargarContadoresAdmin_ahbb();
  }
);

// Polling automático cada 60 segundos para badges del Admin
useAutoRefresh_ahbb(cargarContadoresAdmin_ahbb, 60_000, false); // false = no duplicar la carga inicial

onMounted(async () => {
  await authStore_ahbb.inicializar_ahbb();
  await cargarContadoresAdmin_ahbb();
});
</script>

<template>
  <!-- ========== LAYOUT LANDING ========== -->
  <div v-if="layoutActual_ahbb === 'landing'" id="app_ah" class="app_ah">
    <Navbar_ah />
    <router-view />
    <Footer_ah />
  </div>

  <!-- ========== LAYOUT AUTH ========== -->
  <div v-else-if="layoutActual_ahbb === 'auth'">
    <router-view />
  </div>

  <!-- ========== LAYOUT SISTEMA (Quasar) ========== -->
  <q-layout v-else-if="layoutActual_ahbb === 'sistema'" view="lHh Lpr lFf">
    <!-- Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="alternarMenuLateral_ahbb" />
        <q-toolbar-title class="text-weight-bold row items-center q-gutter-xs" style="font-family: 'Outfit', 'Inter', sans-serif">
          <img src="/graduation-cap.png" alt="H&B" style="width:24px;height:24px;object-fit:contain;display:block;" />
          Academia <span style="color: #f59e0b">H&B</span>
        </q-toolbar-title>
        <q-space />
        <div class="row items-center q-gutter-sm">
          <BadgeCarrito_ahbb v-if="authStore_ahbb.estaAutenticado_ahbb" />
          <q-badge
            :color="colorRol_ahbb"
            :label="etiquetaRol_ahbb"
            class="q-mr-sm"
          />
          <span class="text-caption gt-xs">
            {{ authStore_ahbb.nombreCompleto_ahbb }}
          </span>
          <q-avatar color="accent" text-color="white" size="36px" font-size="14px">
            {{ authStore_ahbb.iniciales_ahbb }}
            <q-menu>
              <q-list style="min-width: 180px">
                <q-item clickable to="/perfil" v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="person" />
                  </q-item-section>
                  <q-item-section>Mi Perfil</q-item-section>
                </q-item>
                <q-item clickable to="/cambiar-contrasena" v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="lock" />
                  </q-item-section>
                  <q-item-section>Cambiar Contraseña</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable @click="cerrarSesion_ahbb" v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="logout" color="negative" />
                  </q-item-section>
                  <q-item-section class="text-negative">Cerrar Sesión</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Drawer / Sidebar dinámico por rol -->
    <q-drawer
      v-model="menuLateralAbierto_ahbb"
      show-if-above
      :width="250"
      :breakpoint="768"
      bordered
      class="bg-dark text-white"
    >
      <!-- Logo -->
      <q-item clickable to="/dashboard" class="q-py-md">
        <q-item-section avatar>
          <img src="/graduation-cap.png" alt="H&B" style="width:22px;height:22px;object-fit:contain;display:block;" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold text-white" style="font-size: 1.1rem">
            Academia <span style="color: #f59e0b">H&B</span>
          </q-item-label>
          <q-item-label caption class="text-grey-5" style="font-size: 0.7rem">
            {{ etiquetaRol_ahbb }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-separator dark />

      <!-- Menú dinámico generado por rol -->
      <q-list>
        <template v-for="(enlace, indice) in enlacesMenu_ahbb" :key="enlace.ruta">
          <!-- Separador opcional -->
          <q-separator dark class="q-my-xs" v-if="enlace.separador && indice > 0" />

          <!-- Encabezado de sección -->
          <q-item-label
            v-if="enlace.encabezado"
            header
            class="text-grey-6 text-uppercase"
            style="font-size: 0.7rem"
          >
            {{ enlace.encabezado }}
          </q-item-label>

          <!-- Enlace de navegación -->
          <q-item
            clickable
            :to="enlace.ruta"
            active-class="bg-grey-9 text-accent"
            class="text-grey-4"
          >
            <q-item-section avatar>
              <q-icon :name="enlace.icono" />
            </q-item-section>
            <q-item-section>{{ enlace.etiqueta }}</q-item-section>
            <!-- Badge de notificación para Inscripciones -->
            <q-item-section
              side
              v-if="enlace.ruta === '/inscripciones' && pendientes_ahbb.alumnos > 0"
            >
              <q-badge color="negative" rounded :label="pendientes_ahbb.alumnos" />
            </q-item-section>
            <!-- Badge de notificación para Cursos (Admin) -->
            <q-item-section
              side
              v-if="enlace.ruta === '/cursos' && authStore_ahbb.esAdministrador_ahbb && pendientes_ahbb.cursos > 0"
            >
              <q-badge color="orange" rounded :label="pendientes_ahbb.cursos" />
            </q-item-section>
          </q-item>
        </template>
      </q-list>

      <q-separator dark class="q-my-sm" />

      <!-- Sección inferior fija -->
      <q-list>
        <q-item-label header class="text-grey-6 text-uppercase" style="font-size: 0.7rem">
          Otros
        </q-item-label>

        <q-item clickable to="/" class="text-grey-4">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Ir al Inicio</q-item-section>
        </q-item>

        <q-item clickable @click="cerrarSesion_ahbb" class="text-grey-4">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>Cerrar Sesión</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Contenido de la página -->
    <q-page-container>
      <q-page padding>
        <router-view />
      </q-page>
    </q-page-container>

    <!-- Modal Modal Obligatorio Cambio Clave -->
    <q-dialog v-model="mostrarAlertaCambioClave_ahbb" persistent>
      <q-card style="width: 500px; max-width: 80vw;">
        <q-card-section class="row items-center bg-warning text-white">
          <q-avatar icon="security" color="white" text-color="warning" />
          <span class="q-ml-sm text-subtitle1 text-bold">Acción de Seguridad Requerida</span>
        </q-card-section>
        <q-card-section class="q-pt-md">
          Has ingresado utilizando una contraseña temporal de validación de identidad. Por políticas de seguridad institucional, debes establecer una contraseña definitiva y privada para poder navegar por el sistema.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn unelevated label="Establecer Clave Nueva Ahora" color="primary" text-color="white" @click="irAlPerfil_ahbb" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<style>
.app_ah {
  min-height: 100vh;
}
</style>

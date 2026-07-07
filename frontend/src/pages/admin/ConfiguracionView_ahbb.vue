<!-- ConfiguracionView_ahbb.vue — Configuración del sistema (solo Administrador) -->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerConfiguracion_ahbb,
  actualizarImagenCertificado_ahbb,
} from '../../servicios/configuracionServicio_ahbb';

const $q_ahbb = useQuasar();
const cargando_ahbb = ref(true);
const configuracion_ahbb = ref(null);

const cargarConfiguracion_ahbb = async () => {
  cargando_ahbb.value = true;
  try {
    configuracion_ahbb.value = await obtenerConfiguracion_ahbb();
  } catch {
    // Silencioso
  } finally {
    cargando_ahbb.value = false;
  }
};

onMounted(cargarConfiguracion_ahbb);
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-primary">
          <q-icon name="settings" class="q-mr-sm" />
          Configuración del Sistema
        </div>
        <div class="text-caption text-grey-7">
          Parámetros generales de la plataforma.
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Sección: Certificados -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-bold q-mb-md">
            <q-icon name="workspace_premium" class="q-mr-sm" color="amber" />
            Certificados
          </div>
          <q-list separator>
            <q-item clickable v-ripple to="/plantillas-certificados">
              <q-item-section avatar>
                <q-icon name="image" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Plantilla de Fondo</q-item-label>
                <q-item-label caption>
                  Configurar la imagen de fondo global para los certificados emitidos.
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/certificados">
              <q-item-section avatar>
                <q-icon name="list_alt" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Certificados Emitidos</q-item-label>
                <q-item-label caption>
                  Ver y gestionar todos los certificados del sistema.
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Sección: Información general -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-bold q-mb-md">
            <q-icon name="info" class="q-mr-sm" color="blue" />
            Información de la Plataforma
          </div>
          <q-list separator>
            <q-item>
              <q-item-section avatar>
                <q-icon name="school" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Academia H&B</q-item-label>
                <q-item-label caption>
                  Sistema de gestión de certificaciones académicas
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="code" color="grey" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Versión</q-item-label>
                <q-item-label caption>v1.0.0</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </div>
</template>

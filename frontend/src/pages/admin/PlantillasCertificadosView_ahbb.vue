<!-- PlantillasCertificadosView_ahbb.vue — Gestión de fondo de certificados -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import {
  obtenerConfiguracion_ahbb,
  actualizarImagenCertificado_ahbb,
} from '../../servicios/configuracionServicio_ahbb';
import {
  obtenerCursos_ahbb,
  actualizarImagenCertificadoCurso_ahbb,
} from '../../servicios/cursosServicio_ahbb';

const $q_ahbb = useQuasar();
const autenticacionStore_ahbb = useAutenticacionStore_ahbb();
const esAdmin_ahbb =
  autenticacionStore_ahbb.usuarioActivo_ahbb?.rol === 'administrador';

const cargando_ahbb = ref(false);
const imagenGlobal_ahbb = ref(null);

// ── Sección profesor: fondos por curso ──
const cursos_ahbb = ref([]);
const cursoSeleccionado_ahbb = ref(null);
const previsualizacionCurso_ahbb = ref(null);
const guardandoCurso_ahbb = ref(false);

// ── Sección admin: fondo global ──
const previsualizacionGlobal_ahbb = ref(null);

const cargarDatos_ahbb = async () => {
  cargando_ahbb.value = true;
  try {
    // Admin: cargar configuración global
    if (esAdmin_ahbb) {
      try {
        const config_ahbb = await obtenerConfiguracion_ahbb();
        imagenGlobal_ahbb.value = config_ahbb.imagenCertificadoGeneral;
      } catch {
        // silencioso
      }
    }

    // Administrador: ver todos los cursos. Profesor: ver solo los suyos.
    const data_ahbb = await obtenerCursos_ahbb(esAdmin_ahbb ? {} : { solo_propios: true });
    cursos_ahbb.value = data_ahbb.filter(
      (c) => c.estadoAprobacion === 'ACTIVO',
    );
  } catch {
    // silencioso
  } finally {
    cargando_ahbb.value = false;
  }
};

const imagenDelCursoSeleccionado_ahbb = computed(() => {
  if (!cursoSeleccionado_ahbb.value) return null;
  const curso_ahbb = cursos_ahbb.value.find(
    (c) => c.id === cursoSeleccionado_ahbb.value,
  );
  return curso_ahbb?.imagenBasePdf ?? null;
});

// ── Handlers de imagen por curso ──
const seleccionarImagenCurso_ahbb = (evento_ahbb) => {
  const archivo_ahbb = evento_ahbb.target?.files?.[0];
  if (!archivo_ahbb) return;

  if (!archivo_ahbb.type.startsWith('image/')) {
    $q_ahbb.notify({
      type: 'negative',
      message: 'Solo se permiten archivos de imagen.',
    });
    return;
  }

  // Prevenir que intente codificar imágenes inmensas y explote la petición HTTP
  const tamañoMaximoBytes = 10 * 1024 * 1024; // 10 MB límite
  if (archivo_ahbb.size > tamañoMaximoBytes) {
    $q_ahbb.notify({
      type: 'warning',
      message: 'La imagen es demasiado pesada. El tamaño máximo permitido es 10 MB.',
    });
    // Limpiar el input para que pueda intentar de nuevo cómodamente
    evento_ahbb.target.value = '';
    return;
  }

  const lector_ahbb = new FileReader();
  lector_ahbb.onload = (e_ahbb) => {
    previsualizacionCurso_ahbb.value = e_ahbb.target.result;
  };
  lector_ahbb.readAsDataURL(archivo_ahbb);
};

const guardarImagenCurso_ahbb = async () => {
  if (!previsualizacionCurso_ahbb.value || !cursoSeleccionado_ahbb.value) return;

  guardandoCurso_ahbb.value = true;
  try {
    const resultado_ahbb = await actualizarImagenCertificadoCurso_ahbb(
      cursoSeleccionado_ahbb.value,
      previsualizacionCurso_ahbb.value,
    );
    if (resultado_ahbb.exito) {
      // Actualizar localmente
      const idx = cursos_ahbb.value.findIndex(
        (c) => c.id === cursoSeleccionado_ahbb.value,
      );
      if (idx >= 0) {
        cursos_ahbb.value[idx].imagenBasePdf =
          previsualizacionCurso_ahbb.value;
      }
      previsualizacionCurso_ahbb.value = null;
      $q_ahbb.notify({
        type: 'positive',
        message: resultado_ahbb.mensaje,
      });
    } else {
      $q_ahbb.notify({
        type: 'negative',
        message: resultado_ahbb.mensaje,
      });
    }
  } catch {
    $q_ahbb.notify({
      type: 'negative',
      message: 'Error al guardar la imagen.',
    });
  } finally {
    guardandoCurso_ahbb.value = false;
  }
};

const eliminarImagenCurso_ahbb = async () => {
  if (!cursoSeleccionado_ahbb.value) return;
  guardandoCurso_ahbb.value = true;
  try {
    const resultado_ahbb = await actualizarImagenCertificadoCurso_ahbb(
      cursoSeleccionado_ahbb.value,
      null,
    );
    if (resultado_ahbb.exito) {
      const idx = cursos_ahbb.value.findIndex(
        (c) => c.id === cursoSeleccionado_ahbb.value,
      );
      if (idx >= 0) cursos_ahbb.value[idx].imagenBasePdf = null;
      $q_ahbb.notify({ type: 'positive', message: 'Fondo eliminado.' });
    }
  } finally {
    guardandoCurso_ahbb.value = false;
  }
};

// ── Handlers admin: fondo global ──
const seleccionarImagenGlobal_ahbb = (evento_ahbb) => {
  const archivo_ahbb = evento_ahbb.target?.files?.[0];
  if (!archivo_ahbb) return;
  if (!archivo_ahbb.type.startsWith('image/')) {
    $q_ahbb.notify({ type: 'negative', message: 'Solo imágenes.' });
    return;
  }

  const tamañoMaximoBytes = 10 * 1024 * 1024; // 10 MB límite
  if (archivo_ahbb.size > tamañoMaximoBytes) {
    $q_ahbb.notify({
      type: 'warning',
      message: 'La imagen es demasiado pesada. El tamaño máximo permitido es 10 MB.',
    });
    evento_ahbb.target.value = '';
    return;
  }
  const lector_ahbb = new FileReader();
  lector_ahbb.onload = (e_ahbb) => {
    previsualizacionGlobal_ahbb.value = e_ahbb.target.result;
  };
  lector_ahbb.readAsDataURL(archivo_ahbb);
};

const guardarImagenGlobal_ahbb = async () => {
  if (!previsualizacionGlobal_ahbb.value) return;
  cargando_ahbb.value = true;
  try {
    const resultado_ahbb = await actualizarImagenCertificado_ahbb(
      previsualizacionGlobal_ahbb.value,
    );
    if (resultado_ahbb.exito) {
      imagenGlobal_ahbb.value = previsualizacionGlobal_ahbb.value;
      previsualizacionGlobal_ahbb.value = null;
      $q_ahbb.notify({ type: 'positive', message: 'Fondo global actualizado.' });
    } else {
      $q_ahbb.notify({ type: 'negative', message: resultado_ahbb.mensaje });
    }
  } finally {
    cargando_ahbb.value = false;
  }
};

onMounted(cargarDatos_ahbb);
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-primary">
          <q-icon name="image" class="q-mr-sm" />
          Plantilla de Certificados
        </div>
        <div class="text-caption text-grey-7">
          Configura la imagen de fondo para los certificados emitidos.
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- ═══════ SECCIÓN PROFESOR: Fondo por Curso ═══════ -->
      <div class="col-12">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-bold q-mb-md">
            <q-icon name="palette" class="q-mr-sm" color="amber" />
            Fondo Personalizado por Curso
          </div>

          <q-banner class="bg-blue-1 text-blue-9 q-mb-md" rounded>
            <template v-slot:avatar>
              <q-icon name="info" color="blue-9" />
            </template>
            Selecciona uno de tus cursos y sube una imagen horizontal (landscape,
            recomendado: 1123 × 794 px). Se mostrará con opacidad reducida detrás
            del contenido del certificado.
          </q-banner>

          <!-- Select de curso -->
          <q-select
            v-model="cursoSeleccionado_ahbb"
            :options="cursos_ahbb.map((c) => ({ label: c.nombre, value: c.id }))"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            label="Seleccionar curso"
            class="q-mb-md"
            style="max-width: 500px"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No hay cursos activos
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Imagen actual del curso seleccionado -->
          <div v-if="cursoSeleccionado_ahbb">
            <div
              v-if="imagenDelCursoSeleccionado_ahbb"
              class="text-center q-mb-md"
            >
              <div class="text-caption text-grey-7 q-mb-sm">
                Fondo actual del curso:
              </div>
              <img
                :src="imagenDelCursoSeleccionado_ahbb"
                alt="Fondo del curso"
                style="
                  max-width: 100%;
                  max-height: 250px;
                  border: 1px solid #e0e0e0;
                  border-radius: 8px;
                  opacity: 0.4;
                "
              />
              <div class="q-mt-sm">
                <q-btn
                  flat
                  dense
                  label="Eliminar fondo"
                  icon="delete"
                  color="negative"
                  :loading="guardandoCurso_ahbb"
                  @click="eliminarImagenCurso_ahbb"
                />
              </div>
            </div>
            <div
              v-else
              class="text-center q-pa-lg text-grey-5 q-mb-md"
              style="border: 2px dashed #e0e0e0; border-radius: 8px"
            >
              <q-icon name="image_not_supported" size="32px" class="q-mb-sm" />
              <div>Este curso no tiene fondo personalizado</div>
              <div class="text-caption">
                Se usará el fondo global (si existe)
              </div>
            </div>

            <!-- Subir nueva imagen -->
            <div class="q-mb-md">
              <input
                type="file"
                accept="image/*"
                @change="seleccionarImagenCurso_ahbb"
              />
            </div>

            <!-- Previsualización -->
            <div v-if="previsualizacionCurso_ahbb" class="text-center q-mb-md">
              <div class="text-caption text-grey-7 q-mb-sm">
                Vista previa (con opacidad aplicada):
              </div>
              <img
                :src="previsualizacionCurso_ahbb"
                alt="Previsualización"
                style="
                  max-width: 100%;
                  max-height: 250px;
                  border: 1px solid #e0e0e0;
                  border-radius: 8px;
                  opacity: 0.15;
                "
              />
              <div class="q-mt-sm q-gutter-sm">
                <q-btn
                  label="Guardar Fondo"
                  color="primary"
                  icon="save"
                  @click="guardarImagenCurso_ahbb"
                  :loading="guardandoCurso_ahbb"
                />
                <q-btn
                  label="Cancelar"
                  flat
                  color="grey"
                  @click="previsualizacionCurso_ahbb = null"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- ═══════ SECCIÓN ADMIN: Fondo Global ═══════ -->
      <div class="col-12" v-if="esAdmin_ahbb">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-weight-bold q-mb-md">
            <q-icon name="public" class="q-mr-sm" color="primary" />
            Fondo Global del Sistema (Solo Admin)
          </div>

          <div class="text-caption text-grey-7 q-mb-md">
            Este fondo se aplica a todos los certificados que NO tienen un fondo
            por curso.
          </div>

          <div v-if="imagenGlobal_ahbb" class="text-center q-mb-md">
            <img
              :src="imagenGlobal_ahbb"
              alt="Fondo global"
              style="
                max-width: 100%;
                max-height: 250px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
              "
            />
          </div>
          <div
            v-else
            class="text-center q-pa-lg text-grey-5 q-mb-md"
            style="border: 2px dashed #e0e0e0; border-radius: 8px"
          >
            <q-icon name="image_not_supported" size="32px" />
            <div>No hay fondo global configurado</div>
          </div>

          <div class="q-mb-md">
            <input
              type="file"
              accept="image/*"
              @change="seleccionarImagenGlobal_ahbb"
            />
          </div>

          <div v-if="previsualizacionGlobal_ahbb" class="text-center q-mb-md">
            <div class="text-caption text-grey-7 q-mb-sm">
              Vista previa:
            </div>
            <img
              :src="previsualizacionGlobal_ahbb"
              alt="Previsualización global"
              style="
                max-width: 100%;
                max-height: 200px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                opacity: 0.15;
              "
            />
            <div class="q-mt-sm q-gutter-sm">
              <q-btn
                label="Guardar Fondo Global"
                color="primary"
                icon="save"
                @click="guardarImagenGlobal_ahbb"
                :loading="cargando_ahbb"
              />
              <q-btn
                label="Cancelar"
                flat
                color="grey"
                @click="previsualizacionGlobal_ahbb = null"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Info de jerarquía -->
    <q-banner class="bg-amber-1 text-amber-9 q-mt-lg" rounded>
      <template v-slot:avatar>
        <q-icon name="lightbulb" color="amber-9" />
      </template>
      <strong>Jerarquía de fondos:</strong> Si un curso tiene fondo
      personalizado, se usará ese. Si no, se usará el fondo global del
      administrador. Si ninguno está configurado, el certificado tendrá un fondo
      blanco limpio.
    </q-banner>
  </div>
</template>

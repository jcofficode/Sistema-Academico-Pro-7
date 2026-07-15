<!-- CarrerasView_cjgp.vue — Gestión de Carreras y Pensums (Administrador) -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import {
  obtenerCarreras_cjgp,
  obtenerDetalleCarrera_cjgp,
  eliminarCarrera_cjgp,
  descargarPlantillaPensum_cjgp,
  asignarProfesorMateria_cjgp,
} from '../../servicios/academicoServicio_cjgp';
import { obtenerProfesoresParaSelect_ahbb } from '../../servicios/usuariosServicio_ahbb';

const $q = useQuasar();
const router_cjgp = useRouter();

const carreras_cjgp = ref([]);
const cargando_cjgp = ref(true);
const detalle_cjgp = ref(null);
const dialogoDetalle_cjgp = ref(false);
const profesores_cjgp = ref([]);

// Opciones del selector: el admin asigna quién dicta cada materia
const opcionesProfesores_cjgp = computed(() => [
  { etiqueta_cjgp: '— Sin profesor asignado —', valor_cjgp: null },
  ...profesores_cjgp.value.map((profesor_cjgp) => ({
    etiqueta_cjgp: `${profesor_cjgp.nombre} ${profesor_cjgp.apellido} (${profesor_cjgp.cedula})`,
    valor_cjgp: profesor_cjgp.id,
  })),
]);

const asignarProfesor_cjgp = async (materia_cjgp, idProfesor_cjgp) => {
  const resultado_cjgp = await asignarProfesorMateria_cjgp(
    materia_cjgp.id_materia_cjgp,
    idProfesor_cjgp,
  );
  $q.notify({
    type: resultado_cjgp.exito ? 'positive' : 'negative',
    message: resultado_cjgp.mensaje,
  });
  if (resultado_cjgp.exito && detalle_cjgp.value) {
    // Refrescar el detalle para ver el profesor reflejado
    detalle_cjgp.value = await obtenerDetalleCarrera_cjgp(
      detalle_cjgp.value.id_carrera_cjgp,
    );
  }
};

const columnas_cjgp = [
  { name: 'codigo', label: 'Código', field: 'codigo_cjgp', align: 'left', sortable: true },
  { name: 'nombre', label: 'Carrera', field: 'nombre_cjgp', align: 'left', sortable: true },
  { name: 'regimen', label: 'Régimen', field: 'regimen_cjgp', align: 'center' },
  { name: 'duracion', label: 'Duración', field: 'duracionAnios_cjgp', align: 'center' },
  { name: 'bloques', label: 'Bloques', field: 'totalBloques_cjgp', align: 'center' },
  { name: 'materias', label: 'Materias', field: 'totalMaterias_cjgp', align: 'center' },
  { name: 'creditos', label: 'Límite Créditos', field: 'limiteCreditos_cjgp', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
];

const cargarCarreras_cjgp = async () => {
  cargando_cjgp.value = true;
  try {
    carreras_cjgp.value = await obtenerCarreras_cjgp();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar las carreras.' });
  } finally {
    cargando_cjgp.value = false;
  }
};

const verDetalle_cjgp = async (idCarrera_cjgp) => {
  try {
    detalle_cjgp.value = await obtenerDetalleCarrera_cjgp(idCarrera_cjgp);
    dialogoDetalle_cjgp.value = true;
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar el detalle de la carrera.' });
  }
};

const confirmarEliminar_cjgp = (carrera_cjgp) => {
  $q.dialog({
    title: 'Eliminar carrera',
    message: `¿Seguro que deseas eliminar "${carrera_cjgp.nombre_cjgp}"? Se borrarán sus materias, prelaciones e inscripciones.`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    const resultado_cjgp = await eliminarCarrera_cjgp(carrera_cjgp.id_carrera_cjgp);
    $q.notify({
      type: resultado_cjgp.exito ? 'positive' : 'negative',
      message: resultado_cjgp.mensaje,
    });
    if (resultado_cjgp.exito) cargarCarreras_cjgp();
  });
};

const descargarPlantilla_cjgp = async (regimen_cjgp) => {
  const exito_cjgp = await descargarPlantillaPensum_cjgp(regimen_cjgp);
  $q.notify({
    type: exito_cjgp ? 'positive' : 'negative',
    message: exito_cjgp
      ? `Plantilla Excel ${regimen_cjgp.toLowerCase()} descargada.`
      : 'No se pudo descargar la plantilla.',
  });
};

onMounted(async () => {
  cargarCarreras_cjgp();
  try {
    profesores_cjgp.value = await obtenerProfesoresParaSelect_ahbb();
  } catch {
    // El selector de profesores quedará vacío; se puede reintentar al reabrir
  }
});
</script>

<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Carreras y Pensums</div>
        <div class="text-caption text-grey-7">
          Oferta académica de la institución — Épica 1 (equipo CJGP)
        </div>
      </div>
      <q-space />
      <!-- Plantilla adaptada al régimen elegido por el administrador -->
      <q-btn-dropdown
        outline
        color="primary"
        icon="download"
        label="Plantilla Excel"
        class="q-mr-sm"
      >
        <q-list dense>
          <q-item clickable v-close-popup @click="descargarPlantilla_cjgp('SEMESTRAL')">
            <q-item-section avatar><q-icon name="calendar_view_month" color="blue-8" /></q-item-section>
            <q-item-section>
              <q-item-label>Plantilla Semestral</q-item-label>
              <q-item-label caption>Ejemplo de 3 años · 6 semestres</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="descargarPlantilla_cjgp('TRIMESTRAL')">
            <q-item-section avatar><q-icon name="view_module" color="purple-8" /></q-item-section>
            <q-item-section>
              <q-item-label>Plantilla Trimestral</q-item-label>
              <q-item-label caption>Ejemplo de 3 años · 9 trimestres</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-btn
        color="primary"
        icon="auto_fix_high"
        label="Nueva carrera (asistente)"
        @click="router_cjgp.push('/admin/carreras/asistente')"
      />
    </div>

    <q-table
      :rows="carreras_cjgp"
      :columns="columnas_cjgp"
      row-key="id_carrera_cjgp"
      :loading="cargando_cjgp"
      flat
      bordered
      no-data-label="Aún no hay carreras registradas. Usa el asistente para crear la primera."
    >
      <template #body-cell-regimen="props">
        <q-td :props="props">
          <q-chip
            dense
            :color="props.row.regimen_cjgp === 'SEMESTRAL' ? 'blue-1' : 'purple-1'"
            :text-color="props.row.regimen_cjgp === 'SEMESTRAL' ? 'blue-9' : 'purple-9'"
          >
            {{ props.row.regimen_cjgp }}
          </q-chip>
        </q-td>
      </template>
      <template #body-cell-duracion="props">
        <q-td :props="props">{{ props.row.duracionAnios_cjgp }} años</q-td>
      </template>
      <template #body-cell-acciones="props">
        <q-td :props="props">
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="visibility"
            @click="verDetalle_cjgp(props.row.id_carrera_cjgp)"
          >
            <q-tooltip>Ver malla curricular</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            @click="confirmarEliminar_cjgp(props.row)"
          >
            <q-tooltip>Eliminar</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Malla curricular: materias agrupadas por bloque con sus prelaciones -->
    <q-dialog v-model="dialogoDetalle_cjgp" maximized>
      <q-card v-if="detalle_cjgp">
        <q-card-section class="row items-center bg-primary text-white">
          <div>
            <div class="text-h6">{{ detalle_cjgp.nombre_cjgp }}</div>
            <div class="text-caption">
              {{ detalle_cjgp.regimen_cjgp }} · {{ detalle_cjgp.duracionAnios_cjgp }} años ·
              Límite {{ detalle_cjgp.limiteCreditos_cjgp }} créditos/período
            </div>
          </div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="row q-col-gutter-md items-start scroll">
          <div
            v-for="bloque_cjgp in detalle_cjgp.bloques_cjgp"
            :key="bloque_cjgp.nroBloque_cjgp"
            class="col-12 col-sm-6 col-md-3"
          >
            <q-card flat bordered>
              <q-card-section class="bg-blue-1 q-py-sm">
                <div class="text-subtitle2 text-weight-bold text-blue-9">
                  {{ detalle_cjgp.regimen_cjgp === 'TRIMESTRAL' ? 'Trimestre' : 'Semestre' }}
                  {{ bloque_cjgp.nroBloque_cjgp }}
                </div>
              </q-card-section>
              <q-list separator dense>
                <q-item v-for="materia_cjgp in bloque_cjgp.materias_cjgp" :key="materia_cjgp.id_materia_cjgp">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ materia_cjgp.codigo_cjgp }} — {{ materia_cjgp.nombre_cjgp }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ materia_cjgp.creditos_cjgp }} créditos
                      <template v-if="materia_cjgp.requisitos_cjgp.length">
                        · 🔒 Requiere:
                        {{ materia_cjgp.requisitos_cjgp.map((r) => r.codigo_cjgp).join(', ') }}
                      </template>
                    </q-item-label>
                    <!-- Asignación del profesor que dicta la materia -->
                    <q-select
                      :model-value="materia_cjgp.id_profesor_materia_cjgp ?? null"
                      :options="opcionesProfesores_cjgp"
                      option-label="etiqueta_cjgp"
                      option-value="valor_cjgp"
                      emit-value
                      map-options
                      dense
                      options-dense
                      borderless
                      class="q-mt-xs"
                      :display-value="
                        materia_cjgp.profesor_cjgp
                          ? `👨‍🏫 ${materia_cjgp.profesor_cjgp.nombre_ahbb} ${materia_cjgp.profesor_cjgp.apellido_ahbb}`
                          : '👨‍🏫 Asignar profesor…'
                      "
                      @update:model-value="(valor_cjgp) => asignarProfesor_cjgp(materia_cjgp, valor_cjgp)"
                    />
                  </q-item-section>
                </q-item>
                <q-item v-if="!bloque_cjgp.materias_cjgp.length">
                  <q-item-section class="text-grey-6 text-caption">Sin materias</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

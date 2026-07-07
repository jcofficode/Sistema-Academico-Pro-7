<!-- MisCertificadosView_ahbb.vue — Certificados del alumno -->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import {
  obtenerMisCertificados_ahbb,
  descargarPdfCertificado_ahbb,
} from '../../servicios/certificadosServicio_ahbb';

const $q_ahbb = useQuasar();
const autenticacionStore_ahbb = useAutenticacionStore_ahbb();

const cargando_ahbb = ref(true);
const certificados_ahbb = ref([]);

const columnas_ahbb = [
  {
    name: 'curso',
    label: 'Curso',
    field: 'curso',
    align: 'left',
    sortable: true,
  },
  {
    name: 'profesor',
    label: 'Profesor',
    field: 'profesor',
    align: 'left',
  },
  {
    name: 'duracionHoras',
    label: 'Duración (h)',
    field: 'duracionHoras',
    align: 'center',
  },

  {
    name: 'fechaEmision',
    label: 'Fecha de Emisión',
    field: 'fechaEmision',
    align: 'center',
    format: (val) =>
      val ? new Date(val).toLocaleDateString('es-VE') : '—',
  },
  {
    name: 'acciones',
    label: 'Acciones',
    field: 'id',
    align: 'center',
  },
];

const cargarCertificados_ahbb = async () => {
  cargando_ahbb.value = true;
  try {
    certificados_ahbb.value = await obtenerMisCertificados_ahbb(
      autenticacionStore_ahbb.usuarioActivo_ahbb.id,
    );
  } catch {
    $q_ahbb.notify({
      type: 'negative',
      message: 'Error al cargar los certificados.',
    });
  } finally {
    cargando_ahbb.value = false;
  }
};

const descargar_ahbb = async (idCertificado_ahbb) => {
  try {
    await descargarPdfCertificado_ahbb(idCertificado_ahbb);
  } catch {
    $q_ahbb.notify({
      type: 'negative',
      message: 'Error al descargar el certificado.',
    });
  }
};

onMounted(cargarCertificados_ahbb);
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-primary">
          <q-icon name="workspace_premium" class="q-mr-sm" />
          Mis Certificados
        </div>
        <div class="text-caption text-grey-7">
          Certificados obtenidos al completar cursos exitosamente.
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <q-card
      v-if="!cargando_ahbb && certificados_ahbb.length === 0"
      flat
      bordered
      class="q-pa-xl text-center"
    >
      <q-icon name="emoji_events" size="64px" color="amber" class="q-mb-md" />
      <div class="text-h6 text-grey-7 q-mb-sm">
        Aún no tienes certificados
      </div>
      <div class="text-body2 text-grey-5">
        Completa y aprueba tus cursos para obtener tus certificaciones aquí.
      </div>
    </q-card>

    <!-- Tabla de certificados -->
    <q-table
      v-else
      :rows="certificados_ahbb"
      :columns="columnas_ahbb"
      row-key="id"
      :loading="cargando_ahbb"
      flat
      bordered
      rows-per-page-label="Registros por página"
      no-data-label="No hay certificados disponibles"
    >


      <template v-slot:body-cell-acciones="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            round
            icon="picture_as_pdf"
            color="red"
            @click="descargar_ahbb(props.row.id)"
          >
            <q-tooltip>Descargar PDF</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
    </q-table>
  </div>
</template>

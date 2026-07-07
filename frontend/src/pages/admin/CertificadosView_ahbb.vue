<!-- CertificadosView_ahbb.vue — Gestión de certificados (Admin/Profesor) -->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import {
  obtenerTodosCertificados_ahbb,
  descargarPdfCertificado_ahbb,
  anularCertificado_ahbb,
} from '../../servicios/certificadosServicio_ahbb';

const $q_ahbb = useQuasar();
const autenticacionStore_ahbb = useAutenticacionStore_ahbb();
const esAdmin_ahbb =
  autenticacionStore_ahbb.usuarioActivo_ahbb?.rol === 'administrador';

const cargando_ahbb = ref(true);
const certificados_ahbb = ref([]);
const filtro_ahbb = ref('');

const columnas_ahbb = [
  {
    name: 'id',
    label: 'Nro.',
    field: 'id',
    align: 'center',
    sortable: true,
    format: (val) => String(val).padStart(6, '0'),
  },
  {
    name: 'alumno',
    label: 'Alumno',
    field: 'alumno',
    align: 'left',
    sortable: true,
  },
  {
    name: 'cedula',
    label: 'Cédula',
    field: 'cedulaAlumno',
    align: 'left',
  },
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
    name: 'fechaEmision',
    label: 'Emitido',
    field: 'fechaEmision',
    align: 'center',
    sortable: true,
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
    certificados_ahbb.value = await obtenerTodosCertificados_ahbb();
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

const confirmarAnular_ahbb = (cert_ahbb) => {
  $q_ahbb
    .dialog({
      title: 'Anular Certificado',
      message: `¿Estás seguro de anular el certificado de "${cert_ahbb.alumno}" del curso "${cert_ahbb.curso}"? Esta acción no se puede deshacer.`,
      ok: { label: 'Anular', color: 'negative', flat: true },
      cancel: { label: 'Cancelar', flat: true },
      persistent: true,
    })
    .onOk(async () => {
      const resultado_ahbb = await anularCertificado_ahbb(cert_ahbb.id);
      if (resultado_ahbb.exito) {
        $q_ahbb.notify({
          type: 'positive',
          message: 'Certificado anulado.',
        });
        cargarCertificados_ahbb();
      } else {
        $q_ahbb.notify({
          type: 'negative',
          message: resultado_ahbb.mensaje,
        });
      }
    });
};

onMounted(cargarCertificados_ahbb);
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold text-primary">
          <q-icon name="workspace_premium" class="q-mr-sm" />
          Gestión de Certificados
        </div>
        <div class="text-caption text-grey-7">
          Todos los certificados emitidos en el sistema.
        </div>
      </div>
    </div>

    <!-- Filtro -->
    <q-card flat bordered class="q-pa-md q-mb-md">
      <div class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="filtro_ahbb"
            dense
            outlined
            placeholder="Buscar por alumno, curso o cédula..."
            clearable
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 text-right">
          <div class="text-subtitle2 text-grey-8">
            Total: {{ certificados_ahbb.length }} certificados
          </div>
        </div>
      </div>
    </q-card>

    <!-- Tabla -->
    <q-table
      :rows="certificados_ahbb"
      :columns="columnas_ahbb"
      row-key="id"
      :loading="cargando_ahbb"
      :filter="filtro_ahbb"
      flat
      bordered
      rows-per-page-label="Registros por página"
      no-data-label="No hay certificados emitidos"
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
          <q-btn
            v-if="esAdmin_ahbb"
            flat
            dense
            round
            icon="delete"
            color="negative"
            @click="confirmarAnular_ahbb(props.row)"
          >
            <q-tooltip>Anular certificado</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
    </q-table>
  </div>
</template>

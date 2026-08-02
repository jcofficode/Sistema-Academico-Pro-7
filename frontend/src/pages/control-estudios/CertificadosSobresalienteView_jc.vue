<!--
  CertificadosSobresalienteView_jc.vue — Registro institucional de certificados.

  Control de Estudios y la administración consultan aquí todos los Certificados
  de Sobresaliente emitidos: a quién, por qué materia, con qué nota, quién los
  emitió y con qué hash de verificación.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerCertificadosSobresaliente_jc,
  descargarCertificadoSobresaliente_jc,
} from '../../servicios/controlEstudiosServicio_jc';

const $q = useQuasar();

const certificados_jc = ref([]);
const cargando_jc = ref(true);
const busqueda_jc = ref('');

const columnas_jc = [
  { name: 'codigo', label: 'Código', field: 'codigo_jc', align: 'left', sortable: true },
  {
    name: 'alumno',
    label: 'Alumno',
    field: (fila_jc) => `${fila_jc.alumno_jc.apellido_ahbb}, ${fila_jc.alumno_jc.nombre_ahbb}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'materia',
    label: 'Materia',
    field: (fila_jc) =>
      `${fila_jc.inscripcionMateria_jc.materia_cjgp.codigo_cjgp} — ${fila_jc.inscripcionMateria_jc.materia_cjgp.nombre_cjgp}`,
    align: 'left',
  },
  {
    name: 'periodo',
    label: 'Período',
    field: (fila_jc) => fila_jc.inscripcionMateria_jc.periodo_cjgp.nombre_cjgp,
    align: 'center',
  },
  { name: 'nota', label: 'Nota', field: 'notaFinal_jc', align: 'center', sortable: true },
  {
    name: 'emisor',
    label: 'Emitido por',
    field: (fila_jc) =>
      fila_jc.emitidoPor_jc
        ? `${fila_jc.emitidoPor_jc.nombre_ahbb} ${fila_jc.emitidoPor_jc.apellido_ahbb}`
        : 'Sistema',
    align: 'left',
  },
  { name: 'fecha', label: 'Fecha', field: 'creadoEn_jc', align: 'center', sortable: true },
  { name: 'acciones', label: '', field: 'acciones', align: 'center' },
];

const formatearFecha_jc = (fecha_jc) =>
  fecha_jc ? new Date(fecha_jc).toLocaleDateString('es-VE') : '—';

/** Resumen rápido: cuántos certificados y cuál es la nota media premiada. */
const resumen_jc = computed(() => {
  if (!certificados_jc.value.length) return { total: 0, promedio: null };
  const suma_jc = certificados_jc.value.reduce(
    (acumulado_jc, certificado_jc) => acumulado_jc + Number(certificado_jc.notaFinal_jc),
    0,
  );
  return {
    total: certificados_jc.value.length,
    promedio: Math.round((suma_jc / certificados_jc.value.length) * 100) / 100,
  };
});

const cargar_jc = async () => {
  cargando_jc.value = true;
  try {
    certificados_jc.value = await obtenerCertificadosSobresaliente_jc();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar el registro de certificados.' });
  } finally {
    cargando_jc.value = false;
  }
};

const descargar_jc = async (certificado_jc) => {
  const exito_jc = await descargarCertificadoSobresaliente_jc(
    certificado_jc.id_certificado_sob_jc,
  );
  if (!exito_jc) {
    $q.notify({ type: 'negative', message: 'No se pudo generar el certificado.' });
  }
};

onMounted(cargar_jc);
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Certificados de Sobresaliente</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Registro institucional de los reconocimientos emitidos — Control de Estudios (JC)
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="amber-8" text-color="white" icon="military_tech" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.total }}</div>
              <div class="text-caption text-grey-7">certificados emitidos</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar color="primary" text-color="white" icon="trending_up" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ resumen_jc.promedio ?? '—' }}</div>
              <div class="text-caption text-grey-7">nota promedio premiada</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-input
          v-model="busqueda_jc"
          label="Buscar por alumno, materia o código"
          outlined
          dense
          clearable
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
    </div>

    <q-table
      :rows="certificados_jc"
      :columns="columnas_jc"
      row-key="id_certificado_sob_jc"
      :filter="busqueda_jc"
      :loading="cargando_jc"
      flat
      bordered
      dense
      :rows-per-page-options="[15, 30, 50, 0]"
    >
      <template #body-cell-nota="props">
        <q-td :props="props" class="text-center">
          <q-chip dense size="sm" color="amber-1" text-color="brown-9" icon="military_tech">
            {{ Number(props.row.notaFinal_jc) }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-fecha="props">
        <q-td :props="props" class="text-center text-caption">
          {{ formatearFecha_jc(props.row.creadoEn_jc) }}
        </q-td>
      </template>

      <template #body-cell-codigo="props">
        <q-td :props="props">
          <div class="text-caption text-weight-medium">{{ props.row.codigo_jc }}</div>
          <div class="text-caption text-grey-6" style="font-size: 10px">
            {{ props.row.hashVerificacion_jc.slice(0, 24) }}…
            <q-tooltip>Hash SHA-256: {{ props.row.hashVerificacion_jc }}</q-tooltip>
          </div>
        </q-td>
      </template>

      <template #body-cell-acciones="props">
        <q-td :props="props" class="text-center">
          <q-btn
            flat
            round
            dense
            size="sm"
            color="amber-9"
            icon="download"
            @click="descargar_jc(props.row)"
          >
            <q-tooltip>Descargar PDF</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template #no-data>
        <div class="full-width text-center text-grey-6 q-pa-lg">
          Todavía no se ha emitido ningún certificado de sobresaliente. Se generan solos al
          cerrar un acta con alumnos de 17 puntos o más.
        </div>
      </template>
    </q-table>
  </q-page>
</template>

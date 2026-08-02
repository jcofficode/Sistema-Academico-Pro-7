<!--
  MisCertificadosSobresalienteView_jc.vue — Reconocimientos del alumno.

  Muestra los Certificados de Sobresaliente que el alumno ha obtenido: se emiten
  automáticamente al cerrar el acta cuando su nota definitiva queda en el rango
  de excelencia (17 a 20 puntos).

  Es un documento propio de las CARRERAS y no debe confundirse con los
  certificados de los cursos libres, que viven en "Mis Certificados".
-->
<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerMisCertificadosSobresaliente_jc,
  descargarCertificadoSobresaliente_jc,
} from '../../servicios/controlEstudiosServicio_jc';

const $q = useQuasar();

const certificados_jc = ref([]);
const cargando_jc = ref(true);
const descargando_jc = ref(null);

const formatearFecha_jc = (fecha_jc) =>
  fecha_jc
    ? new Date(fecha_jc).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '—';

const cargar_jc = async () => {
  cargando_jc.value = true;
  try {
    certificados_jc.value = await obtenerMisCertificadosSobresaliente_jc();
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar tus certificados.' });
  } finally {
    cargando_jc.value = false;
  }
};

const descargar_jc = async (certificado_jc) => {
  descargando_jc.value = certificado_jc.id_certificado_sob_jc;
  const exito_jc = await descargarCertificadoSobresaliente_jc(
    certificado_jc.id_certificado_sob_jc,
  );
  descargando_jc.value = null;
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
      Reconocimiento a la excelencia académica en las materias de tu carrera — Control de
      Estudios (JC)
    </div>

    <q-banner dense rounded class="bg-amber-1 text-brown-9 q-mb-md">
      <template #avatar><q-icon name="military_tech" color="amber-8" /></template>
      Se otorga automáticamente cuando cierras una materia con <strong>17 puntos o más</strong>.
      Cada certificado lleva un código único y un código QR con el que cualquiera puede
      verificar su autenticidad.
    </q-banner>

    <q-inner-loading :showing="cargando_jc" />

    <div class="row q-col-gutter-md">
      <div
        v-for="certificado_jc in certificados_jc"
        :key="certificado_jc.id_certificado_sob_jc"
        class="col-12 col-md-6"
      >
        <q-card flat bordered class="tarjeta-sobresaliente_jc">
          <q-card-section class="row items-center no-wrap">
            <q-avatar color="amber-8" text-color="white" icon="military_tech" size="46px" />
            <div class="q-ml-md col">
              <div class="text-subtitle1 text-weight-bold">
                {{ certificado_jc.inscripcionMateria_jc.materia_cjgp.codigo_cjgp }} —
                {{ certificado_jc.inscripcionMateria_jc.materia_cjgp.nombre_cjgp }}
              </div>
              <div class="text-caption text-grey-8">
                {{ certificado_jc.inscripcionMateria_jc.materia_cjgp.carrera_cjgp.nombre_cjgp }} ·
                Período {{ certificado_jc.inscripcionMateria_jc.periodo_cjgp.nombre_cjgp }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-h5 text-weight-bold text-amber-9">
                {{ Number(certificado_jc.notaFinal_jc) }}
              </div>
              <div class="text-caption text-grey-7">puntos</div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-py-sm text-caption text-grey-7">
            <div><strong>Código:</strong> {{ certificado_jc.codigo_jc }}</div>
            <div><strong>Emitido:</strong> {{ formatearFecha_jc(certificado_jc.creadoEn_jc) }}</div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              color="amber-9"
              icon="download"
              label="Descargar PDF"
              :loading="descargando_jc === certificado_jc.id_certificado_sob_jc"
              @click="descargar_jc(certificado_jc)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <div v-if="!certificados_jc.length && !cargando_jc" class="text-center text-grey-6 q-pa-xl">
      <q-icon name="military_tech" size="52px" color="grey-4" class="q-mb-sm" />
      <div>Todavía no tienes certificados de sobresaliente.</div>
      <div class="text-caption">
        Cierra una materia con 17 puntos o más y aparecerá aquí automáticamente.
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.tarjeta-sobresaliente_jc {
  border-left: 4px solid #b8860b;
}
</style>

<!--
  CursoDetalleView_ahbb.vue — Vista de detalle con Quasar
-->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCursosStore_ahbb } from '../stores/cursosStore_ahbb';
import DetalleCurso_ahbb from '../components/cursos/DetalleCurso_ahbb.vue';

const route_ahbb = useRoute();
const router_ahbb = useRouter();
const cursosStore_ahbb = useCursosStore_ahbb();
const curso_ahbb = ref(null);

// Determinar el origen para el botón de volver
const origen_ahbb = computed(() => {
  const from = route_ahbb.query.from;
  if (from === 'horarios') return { label: 'Volver a Horarios', route: '/horarios' };
  if (from === 'oferta') return { label: 'Volver a Oferta Académica', route: '/alumno/oferta-academica' };
  return { label: 'Volver a Cursos', route: '/cursos' };
});

onMounted(() => {
  const id_ahbb = route_ahbb.params['id'];
  const encontrado_ahbb = cursosStore_ahbb.obtenerCursoPorId_ahbb(id_ahbb);
  if (encontrado_ahbb) {
    curso_ahbb.value = encontrado_ahbb;
  } else {
    void router_ahbb.push({ name: 'cursos' });
  }
});
</script>

<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">Detalle del Curso</div>
      <q-btn 
        :label="origen_ahbb.label" 
        icon="arrow_back" 
        unelevated 
        color="primary" 
        text-color="white" 
        :to="origen_ahbb.route" 
      />
    </div>
    <DetalleCurso_ahbb v-if="curso_ahbb" :curso_ahbb="curso_ahbb" :origen_ahbb="origen_ahbb" />
  </div>
</template>

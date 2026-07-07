<!-- OfertaAcademicaView_ahbb.vue — Catálogo de cursos para alumnos -->
<script setup>
import { onMounted, computed } from 'vue';
import { useCursosStore_ahbb } from '../../stores/cursosStore_ahbb';
import { useAutoRefresh_ahbb } from '../../composables/useAutoRefresh_ahbb';

const cursosStore_ahbb = useCursosStore_ahbb();
const recargarOferta_ahbb = () => cursosStore_ahbb.recargarCursos_ahbb();

// Polling cada 90s: nuevos cursos publicados aparecen automáticamente
useAutoRefresh_ahbb(recargarOferta_ahbb, 90_000);

const cursosOfertados_ahbb = computed(() => {
  return cursosStore_ahbb.listaCursos_ahbb.filter(c => c.estatus === 'activo' || c.isPublished);
});

const formatearFecha_ahbb = (fecha) => {
  if (!fecha) return 'Por definir';
  return new Date(fecha).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<template>
  <div class="q-pa-md">
    <div class="text-h4 text-weight-bold q-mb-lg flex items-center text-primary">
      <q-icon name="menu_book" class="q-mr-md" />
      Oferta Académica
    </div>

    <q-banner class="bg-blue-1 text-blue-9 q-mb-xl" rounded>
      <template v-slot:avatar>
        <q-icon name="info" color="blue" />
      </template>
      Explora los cursos disponibles, revisa horarios, profesores e inscríbete para avanzar en tu ruta de aprendizaje.
    </q-banner>

    <div v-if="cursosStore_ahbb.cargando_ahbb" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="50px" />
    </div>

    <div v-else class="row q-col-gutter-lg">
      <div 
        class="col-12 col-sm-6 col-md-4" 
        v-for="curso in cursosOfertados_ahbb" 
        :key="curso.id"
      >
        <q-card flat bordered class="column full-height" style="border-radius: 12px; transition: transform 0.2s; cursor: pointer" @click="$router.push(`/cursos/${curso.id}?from=oferta`)">
          <q-card-section class="bg-primary text-white">
            <div class="text-caption text-uppercase text-weight-bold" style="letter-spacing: 1px">{{ curso.tienePrelacion ? 'Avanzado' : 'Básico' }}</div>
            <div class="text-h6 text-weight-bold q-mt-xs">{{ curso.nombre }}</div>
          </q-card-section>

          <q-card-section class="q-pt-md flex-grow-1">
            <div class="text-body2 text-grey-8 q-mb-md" style="min-height: 40px">
               {{ curso.descripcion.length > 80 ? curso.descripcion.substring(0, 80) + '...' : curso.descripcion }}
            </div>
            
            <q-list dense>
              <q-item class="q-pa-none q-mb-xs">
                <q-item-section avatar min-width="30px"><q-icon name="person" color="grey-6" size="sm" /></q-item-section>
                <q-item-section class="text-body2 text-grey-8">{{ curso.profesor }}</q-item-section>
              </q-item>
              
              <q-item class="q-pa-none q-mb-xs">
                <q-item-section avatar min-width="30px"><q-icon name="event" color="primary" size="sm" /></q-item-section>
                <q-item-section class="text-body2 text-weight-bold text-primary">Inicia: {{ formatearFecha_ahbb(curso.fechaInicio) }}</q-item-section>
              </q-item>

              <q-item class="q-pa-none q-mb-xs">
                <q-item-section avatar min-width="30px"><q-icon name="schedule" color="grey-6" size="sm" /></q-item-section>
                <q-item-section class="text-body2 text-grey-8">{{ curso.duracionHoras }}h / {{ curso.cantidadDias }} clases</q-item-section>
              </q-item>
              <q-item class="q-pa-none">
                <q-item-section avatar min-width="30px"><q-icon name="groups" color="grey-6" size="sm" /></q-item-section>
                <q-item-section class="text-body2 text-grey-8">{{ curso.estudiantesInscritos }} de {{ curso.topeEstudiantes }} inscritos</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat color="primary" label="Ver Detalles" icon-right="arrow_forward" :to="`/cursos/${curso.id}?from=oferta`" />
          </q-card-actions>
        </q-card>
      </div>

      <div v-if="cursosOfertados_ahbb.length === 0" class="col-12 text-center text-grey-6 q-py-xl">
        <q-icon name="inbox" size="4rem" color="grey-4" />
        <div class="text-h6 q-mt-md">Aún no hay cursos en oferta</div>
        <div class="text-body1 q-mt-sm">Los nuevos cursos se publicarán pronto.</div>
      </div>
    </div>
  </div>
</template>

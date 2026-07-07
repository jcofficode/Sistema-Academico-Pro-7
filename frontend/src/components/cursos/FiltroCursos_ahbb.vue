<!--
  FiltroCursos_ahbb.vue — Componente 4: Filtros con Quasar
-->
<script setup>
import { useCursosStore_ahbb } from '../../stores/cursosStore_ahbb';

const cursosStore_ahbb = useCursosStore_ahbb();

const opcionesEstatus_ahbb = [
  { label: 'Todos los estatus', value: 'todos' },
  { label: 'Activos', value: 'activo' },
  { label: 'Iniciados', value: 'iniciado' },
  { label: 'Pendientes (por aprobar)', value: 'pendiente' },
  { label: 'Rechazados', value: 'rechazado' },
  { label: 'Archivados', value: 'archivado' },
];

const manejarBusqueda_ahbb = (valor_ahbb) => {
  cursosStore_ahbb.buscar_ahbb(String(valor_ahbb ?? ''));
};

const manejarFiltro_ahbb = (valor_ahbb) => {
  cursosStore_ahbb.filtrarPorEstatus_ahbb(valor_ahbb);
};
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="q-py-sm">
      <div class="row q-col-gutter-sm items-center">
        <div class="col-12 col-sm">
          <q-input
            :model-value="cursosStore_ahbb.terminoBusqueda_ahbb"
            @update:model-value="manejarBusqueda_ahbb"
            placeholder="Buscar por nombre, profesor o descripcion..."
            outlined
            dense
            debounce="300"
            clearable
          >
            <template v-slot:prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-auto">
          <q-select
            :model-value="cursosStore_ahbb.filtroEstatus_ahbb"
            @update:model-value="manejarFiltro_ahbb"
            :options="opcionesEstatus_ahbb"
            outlined
            dense
            emit-value
            map-options
            style="min-width: 180px"
          />
        </div>
        <div class="col-auto">
          <q-btn
            icon="clear_all"
            label="Limpiar"
            outline
            dense
            color="grey-7"
            @click="cursosStore_ahbb.limpiarFiltros_ahbb()"
          />
        </div>
      </div>
      <div class="text-caption text-grey-6 q-mt-xs">
        {{ cursosStore_ahbb.cursosFiltrados_ahbb.length }} curso(s) encontrado(s)
      </div>
    </q-card-section>
  </q-card>
</template>

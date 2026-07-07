<script setup>
import { onMounted, computed } from 'vue';
import { useTiendaStore_ahbb } from '../../stores/tiendaStore_ahbb';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import TarjetaProducto_ahbb from '../../components/tienda/TarjetaProducto_ahbb.vue';
import { useRouter } from 'vue-router';

const tiendaStore = useTiendaStore_ahbb();
const authStore = useAutenticacionStore_ahbb();
const router = useRouter();

const estaLogueado = computed(() => authStore.estaAutenticado_ahbb);

onMounted(async () => {
  await tiendaStore.cargarProductos_ahbb();
  if (estaLogueado.value) {
    await tiendaStore.cargarIdsFavoritos_ahbb();
  }
});
</script>

<template>
  <div class="q-pa-md" style="min-height: 80vh">
    <div class="row align-center justify-between q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">Tienda de la Academia</div>
      <div>
        <q-btn v-if="estaLogueado" outline color="primary" icon="favorite" label="Mis Favoritos" to="/tienda/favoritos" class="q-mr-sm" />
        <q-btn v-if="estaLogueado" outline color="secondary" icon="receipt_long" label="Mis Compras" to="/tienda/compras" />
      </div>
    </div>

    <!-- Buscador y Filtros -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Buscador -->
      <div class="col-12 col-md-8">
        <q-input
          v-model="tiendaStore.terminoBusqueda_ahbb"
          filled
          debounce="300"
          placeholder="Buscar productos..."
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Filtro Categoría -->
      <div class="col-12 col-md-4">
        <q-select
          v-model="tiendaStore.filtroCategoria_ahbb"
          :options="tiendaStore.categoriasDisponibles_ahbb"
          filled
          emit-value
          map-options
          label="Categoría"
          class="text-capitalize"
        >
          <template v-slot:selected-item="scope">
            <span class="text-capitalize">{{ scope.opt }}</span>
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section class="text-capitalize">{{ scope.opt }}</q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="tiendaStore.cargando_ahbb" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <!-- Grid de Productos -->
    <div v-else-if="tiendaStore.productosFiltrados_ahbb.length > 0" class="row q-col-gutter-md">
      <div
        class="col-12 col-sm-6 col-md-4 col-lg-3"
        v-for="producto in tiendaStore.productosFiltrados_ahbb"
        :key="producto.id_producto_ahbb"
      >
        <TarjetaProducto_ahbb :producto="producto" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center q-pa-xl text-grey-6">
      <q-icon name="production_quantity_limits" size="64px" />
      <div class="text-h6 q-mt-md">No se encontraron productos</div>
      <div class="text-subtitle1">Intenta con otra búsqueda o categoría.</div>
    </div>
  </div>
</template>

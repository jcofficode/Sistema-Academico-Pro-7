<script setup>
import { onMounted, ref } from 'vue';
import { useTiendaStore_ahbb } from '../../stores/tiendaStore_ahbb';
import TarjetaProducto_ahbb from '../../components/tienda/TarjetaProducto_ahbb.vue';

const tiendaStore = useTiendaStore_ahbb();
const cargando = ref(true);

onMounted(async () => {
  await Promise.all([
    tiendaStore.cargarFavoritos_ahbb(),
    tiendaStore.cargarIdsFavoritos_ahbb(),
  ]);
  cargando.value = false;
});
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row align-center q-mb-lg">
      <q-btn flat round icon="arrow_back" color="primary" to="/tienda" class="q-mr-sm" />
      <div class="text-h4 text-weight-bold text-primary">Mis Favoritos</div>
    </div>

    <div v-if="cargando" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-else-if="tiendaStore.listaFavoritos_ahbb.length > 0" class="row q-col-gutter-md">
      <div
        class="col-12 col-sm-6 col-md-4 col-lg-3"
        v-for="fav in tiendaStore.listaFavoritos_ahbb"
        :key="fav.id_favorito_ahbb"
      >
        <TarjetaProducto_ahbb :producto="fav.producto_ahbb" />
      </div>
    </div>

    <div v-else class="text-center q-pa-xl text-grey-6">
      <q-icon name="favorite_border" size="64px" />
      <div class="text-h6 q-mt-md">Aún no tienes productos favoritos</div>
      <q-btn flat color="primary" label="Explorar Tienda" to="/tienda" class="q-mt-md" />
    </div>
  </q-page>
</template>

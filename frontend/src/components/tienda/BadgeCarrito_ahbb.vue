<script setup>
import { onMounted } from 'vue';
import { useTiendaStore_ahbb } from '../../stores/tiendaStore_ahbb';
import { useRouter } from 'vue-router';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';

const tiendaStore = useTiendaStore_ahbb();
const router = useRouter();
const authStore = useAutenticacionStore_ahbb();

onMounted(async () => {
  if (authStore.estaAutenticado_ahbb) {
    await tiendaStore.cargarCarrito_ahbb();
  }
});

const irAlCarrito = () => {
  router.push('/tienda/carrito');
};
</script>

<template>
  <q-btn flat round icon="shopping_cart" color="white" @click="irAlCarrito">
    <q-badge color="red" floating v-if="tiendaStore.totalItemsCarrito_ahbb > 0">
      {{ tiendaStore.totalItemsCarrito_ahbb }}
    </q-badge>
  </q-btn>
</template>

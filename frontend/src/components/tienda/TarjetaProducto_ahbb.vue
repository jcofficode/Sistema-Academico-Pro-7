<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useTiendaStore_ahbb } from '../../stores/tiendaStore_ahbb';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const $q = useQuasar();
const tiendaStore = useTiendaStore_ahbb();
const authStore = useAutenticacionStore_ahbb();

const esFavorito = computed(() => tiendaStore.esFavorito_ahbb(props.producto.id_producto_ahbb));
const estaLogueado = computed(() => authStore.estaAutenticado_ahbb);

const irADetalle = () => {
  router.push(`/tienda/producto/${props.producto.id_producto_ahbb}`);
};

const toggleFavorito = async (evento) => {
  evento.stopPropagation();
  if (!estaLogueado.value) {
    $q.notify({ type: 'warning', message: 'Debes iniciar sesión para usar favoritos' });
    return;
  }
  try {
    await tiendaStore.toggleFavorito_ahbb(props.producto.id_producto_ahbb);
    $q.notify({
      type: 'positive',
      message: esFavorito.value ? 'Agregado a favoritos' : 'Eliminado de favoritos',
    });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error procesando favorito' });
  }
};

const agregarAlCarrito = async (evento) => {
  evento.stopPropagation();
  if (!estaLogueado.value) {
    $q.dialog({
      title: '¡Acceso Exclusivo!',
      message: '¿Quieres acceder a nuestra merch? ¡Conviértete en miembro de la Academia H&B iniciando sesión o registrándote ahora mismo!',
      ok: { label: 'Iniciar Sesión', color: 'primary', unelevated: true },
      cancel: { label: 'Cerrar', color: 'grey-7', flat: true },
    }).onOk(() => {
      router.push('/login');
    });
    return;
  }
  if (props.producto.stock_ahbb <= 0) {
    $q.notify({ type: 'negative', message: 'Producto agotado' });
    return;
  }
  try {
    await tiendaStore.agregarAlCarrito_ahbb(props.producto.id_producto_ahbb, 1);
    $q.notify({ type: 'positive', message: 'Producto agregado al carrito' });
  } catch (error) {
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error agregando al carrito' });
  }
};
</script>

<template>
  <q-card class="tarjeta-producto cursor-pointer" @click="irADetalle" flat bordered>
    <q-img
      :src="producto.imagen_ahbb || 'https://via.placeholder.com/400x300?text=Sin+Imagen'"
      :ratio="4/3"
      class="img-producto"
    >
      <!-- Botón Favorito Absoluto -->
      <div class="absolute-top-right bg-transparent q-pa-sm">
        <q-btn
          round
          flat
          dense
          :color="esFavorito ? 'red' : 'grey-7'"
          :icon="esFavorito ? 'favorite' : 'favorite_border'"
          size="md"
          class="bg-white text-weight-bold"
          @click="toggleFavorito"
        />
      </div>

      <template v-slot:error>
        <div class="absolute-full flex flex-center bg-grey-3 text-grey-7">
          Sin Imagen
        </div>
      </template>
    </q-img>

    <q-card-section class="q-pb-xs">
      <div class="row align-center justify-between">
        <div class="text-overline text-uppercase text-grey-8">{{ producto.categoria_ahbb }}</div>
        <q-badge color="negative" v-if="producto.stock_ahbb <= 0">Agotado</q-badge>
      </div>
      <div class="text-h6 ellipsis q-mt-sm" :title="producto.nombre_ahbb">{{ producto.nombre_ahbb }}</div>
      <div class="text-h6 text-primary text-weight-bold q-mt-xs">
        ${{ Number(producto.precio_ahbb).toFixed(2) }}
      </div>
    </q-card-section>

    <q-card-actions align="right" class="q-px-md q-pb-md">
      <q-btn
        unelevated
        color="primary"
        icon="add_shopping_cart"
        label="Agregar"
        class="full-width"
        @click="agregarAlCarrito"
        :disable="producto.stock_ahbb <= 0"
      />
    </q-card-actions>
  </q-card>
</template>

<style scoped>
.tarjeta-producto {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tarjeta-producto:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}
.img-producto {
  border-bottom: 1px solid rgba(0,0,0,0.12);
}
.q-card__section {
  flex-grow: 1;
}
</style>

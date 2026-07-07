<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { obtenerProductoPorId_ahbb } from '../../servicios/tiendaServicio_ahbb';
import { useTiendaStore_ahbb } from '../../stores/tiendaStore_ahbb';
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const tiendaStore = useTiendaStore_ahbb();
const authStore = useAutenticacionStore_ahbb();

const producto = ref(null);
const cargando = ref(true);
const cantidadSeleccionada = ref(1);

const id = route.params.id;
const esFavorito = computed(() => producto.value ? tiendaStore.esFavorito_ahbb(producto.value.id_producto_ahbb) : false);
const estaLogueado = computed(() => authStore.estaAutenticado_ahbb);

onMounted(async () => {
  try {
    const resp = await obtenerProductoPorId_ahbb(id);
    producto.value = resp.data;
    if (estaLogueado.value) {
      await tiendaStore.cargarIdsFavoritos_ahbb();
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: 'No se pudo cargar el producto' });
    router.push('/tienda');
  } finally {
    cargando.value = false;
  }
});

const incrementar = () => {
  if (cantidadSeleccionada.value < producto.value.stock_ahbb) {
    cantidadSeleccionada.value++;
  }
};

const decrementar = () => {
  if (cantidadSeleccionada.value > 1) {
    cantidadSeleccionada.value--;
  }
};

const toggleFavorito = async () => {
  if (!estaLogueado.value) {
    $q.notify({ type: 'warning', message: 'Debes iniciar sesión para usar favoritos' });
    return;
  }
  try {
    await tiendaStore.toggleFavorito_ahbb(producto.value.id_producto_ahbb);
    $q.notify({
      type: 'positive',
      message: esFavorito.value ? 'Eliminado de favoritos' : 'Agregado a favoritos',
    });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error procesando favorito' });
  }
};

const agregarAlCarrito = async () => {
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
  try {
    await tiendaStore.agregarAlCarrito_ahbb(producto.value.id_producto_ahbb, cantidadSeleccionada.value);
    $q.notify({ type: 'positive', message: 'Producto agregado al carrito exitosamente' });
    router.push('/tienda/carrito');
  } catch (error) {
    $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error agregando al carrito' });
  }
};
</script>

<template>
  <div class="q-pa-md" style="min-height: 80vh">
    <div v-if="cargando" class="flex flex-center" style="min-height: 400px">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-else-if="producto" class="row q-col-gutter-lg justify-center">
      <!-- Botón volver -->
      <div class="col-12">
        <q-btn flat color="primary" icon="arrow_back" label="Volver a la tienda" to="/tienda" class="q-mb-md" />
      </div>

      <!-- Imagen -->
      <div class="col-12 col-md-6 col-lg-5">
        <q-card flat bordered class="overflow-hidden">
          <q-img
            :src="producto.imagen_ahbb || 'https://via.placeholder.com/600x600?text=Sin+Imagen'"
            :ratio="1"
            class="fit"
          >
             <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-3 text-grey-7 text-h6">
                Sin Imagen Disponible
              </div>
            </template>
          </q-img>
        </q-card>
      </div>

      <!-- Info Producto -->
      <div class="col-12 col-md-6 col-lg-5">
        <div class="text-overline text-uppercase text-grey-7 q-mb-xs row items-center justify-between">
          <span>{{ producto.categoria_ahbb }}</span>
          <q-btn
            round flat dense
            :color="esFavorito ? 'red' : 'grey-5'"
            :icon="esFavorito ? 'favorite' : 'favorite_border'"
            @click="toggleFavorito"
            size="lg"
            title="Añadir a favoritos"
          />
        </div>

        <h1 class="text-h3 text-weight-bolder q-mt-none q-mb-sm">{{ producto.nombre_ahbb }}</h1>
        <div class="text-h4 text-primary text-weight-bold q-mb-md">${{ Number(producto.precio_ahbb).toFixed(2) }}</div>

        <q-chip
          v-if="producto.stock_ahbb > 0"
          color="positive"
          text-color="white"
          icon="check_circle"
          class="q-mb-lg"
          square
        >
          En stock ({{ producto.stock_ahbb }} disponibles)
        </q-chip>
        <q-chip v-else color="negative" text-color="white" icon="error" class="q-mb-lg" square>
          Agotado
        </q-chip>

        <p class="text-body1 text-grey-8 q-mb-xl" style="white-space: pre-line">
          {{ producto.descripcion_ahbb || 'Sin descripción disponible.' }}
        </p>

        <q-separator class="q-mb-lg" />

        <div class="row q-col-gutter-sm items-center">
          <!-- Selector Cantidad -->
          <div class="col-12 col-sm-auto">
            <div class="row align-center shadow-1" style="border-radius: 4px; overflow: hidden">
              <q-btn flat class="bg-grey-2" icon="remove" @click="decrementar" :disable="cantidadSeleccionada <= 1 || producto.stock_ahbb <= 0" square />
              <div class="flex flex-center bg-white text-weight-bold" style="width: 50px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc">
                {{ cantidadSeleccionada }}
              </div>
              <q-btn flat class="bg-grey-2" icon="add" @click="incrementar" :disable="cantidadSeleccionada >= producto.stock_ahbb" square />
            </div>
          </div>

          <!-- Botón Agregar -->
          <div class="col-12 col-sm">
            <q-btn
              unelevated
              color="primary"
              size="lg"
              class="full-width"
              icon="shopping_basket"
              label="Añadir al carrito"
              @click="agregarAlCarrito"
              :disable="producto.stock_ahbb <= 0"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

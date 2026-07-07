<script setup>
import { onMounted, ref } from 'vue';
import { useTiendaStore_ahbb } from '../../stores/tiendaStore_ahbb';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { reglaReferenciaPago_ahbb, validarReferenciaPago_ahbb } from '../../constantes/validacionPago_ahbb';

const tiendaStore = useTiendaStore_ahbb();
const $q = useQuasar();
const router = useRouter();
const referenciaPago = ref('');

onMounted(async () => {
  await tiendaStore.cargarCarrito_ahbb();
});

const actualizarCantidad = async (item, num) => {
  const nuevaCantidad = item.cantidad_ahbb + num;
  if (nuevaCantidad < 1) return;
  if (nuevaCantidad > item.producto_ahbb.stock_ahbb) {
    $q.notify({ type: 'warning', message: 'No hay suficiente stock disponible' });
    return;
  }
  try {
    await tiendaStore.actualizarCantidad_ahbb(item.id_carrito_ahbb, nuevaCantidad);
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error actualizando cantidad' });
  }
};

const eliminarItem = async (id) => {
  try {
    await tiendaStore.eliminarItem_ahbb(id);
    $q.notify({ type: 'positive', message: 'Producto eliminado del carrito' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error eliminando el producto' });
  }
};

const confirmarCheckout = () => {
  const validacion = validarReferenciaPago_ahbb(referenciaPago.value);
  if (!validacion.valido) {
    $q.notify({ type: 'negative', message: validacion.mensaje });
    return;
  }

  $q.dialog({
    title: 'Confirmar Compra',
    message: `¿Desea procesar el pago por un total de $${tiendaStore.totalPrecioCarrito_ahbb.toFixed(2)}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await tiendaStore.checkout_ahbb(referenciaPago.value);
      $q.notify({ type: 'positive', message: '¡Compra procesada exitosamente!' });
      router.push('/tienda/compras');
    } catch (error) {
      $q.notify({ type: 'negative', message: error.response?.data?.message || 'Error procesando la compra' });
    }
  });
};
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row align-center q-mb-lg">
      <q-btn flat round icon="arrow_back" color="primary" to="/tienda" class="q-mr-sm" />
      <div class="text-h4 text-weight-bold text-primary">Mi Carrito</div>
    </div>

    <div v-if="tiendaStore.cargandoCarrito_ahbb" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-else-if="tiendaStore.itemsCarrito_ahbb.length === 0" class="text-center q-pa-xl">
      <q-icon name="remove_shopping_cart" size="100px" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-7">Tu carrito está vacío</div>
      <q-btn color="primary" label="Ir a la tienda" to="/tienda" class="q-mt-md" unelevated />
    </div>

    <div v-else class="row q-col-gutter-lg">
      <!-- Lista de items -->
      <div class="col-12 col-md-8">
        <q-list bordered separator class="rounded-borders bg-white shadow-1">
          <q-item v-for="item in tiendaStore.itemsCarrito_ahbb" :key="item.id_carrito_ahbb" class="q-py-md">
            <q-item-section avatar>
              <q-avatar size="80px" rounded>
                <img :src="item.producto_ahbb.imagen_ahbb || 'https://via.placeholder.com/150?text=Sin+Imagen'">
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-h6 text-weight-medium">{{ item.producto_ahbb.nombre_ahbb }}</q-item-label>
              <q-item-label caption class="text-grey-8">
                Precio unitario: ${{ Number(item.producto_ahbb.precio_ahbb).toFixed(2) }}
              </q-item-label>
              <q-item-label caption v-if="item.producto_ahbb.stock_ahbb <= 5" class="text-orange">
                Solo quedan {{ item.producto_ahbb.stock_ahbb }} disponibles
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-mb-sm">
                <q-btn flat round size="sm" icon="remove" @click="actualizarCantidad(item, -1)" :disable="item.cantidad_ahbb <= 1" />
                <div class="q-px-sm text-weight-bold" style="font-size: 1.1rem">{{ item.cantidad_ahbb }}</div>
                <q-btn flat round size="sm" icon="add" @click="actualizarCantidad(item, 1)" :disable="item.cantidad_ahbb >= item.producto_ahbb.stock_ahbb" />
              </div>
              <div class="text-weight-bold text-primary" style="font-size: 1.1rem">
                ${{ (Number(item.producto_ahbb.precio_ahbb) * item.cantidad_ahbb).toFixed(2) }}
              </div>
            </q-item-section>

            <q-item-section side>
              <q-btn flat round color="negative" icon="delete" @click="eliminarItem(item.id_carrito_ahbb)" title="Eliminar" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Sumario de Pago -->
      <div class="col-12 col-md-4">
        <q-card flat bordered class="shadow-1">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Resumen del Pedido</div>
          </q-card-section>

          <q-card-section>
            <div class="row justify-between q-mb-sm text-body1">
              <span>Artículos ({{ tiendaStore.totalItemsCarrito_ahbb }}):</span>
              <span>${{ tiendaStore.totalPrecioCarrito_ahbb.toFixed(2) }}</span>
            </div>
            <q-separator class="q-my-md" />
            <div class="row justify-between text-h5 text-weight-bold text-primary q-mb-md">
              <span>Total:</span>
              <span>${{ tiendaStore.totalPrecioCarrito_ahbb.toFixed(2) }}</span>
            </div>

            <q-input
              v-model="referenciaPago"
              filled
              label="Ref. Pago Móvil / Transferencia"
              hint="Solo dígitos • Mín. 8 • Máx. 20"
              class="q-mb-md"
              maxlength="20"
              inputmode="numeric"
              :rules="reglaReferenciaPago_ahbb"
              lazy-rules
            >
              <template v-slot:prepend><q-icon name="receipt" /></template>
            </q-input>
          </q-card-section>

          <q-card-actions class="q-pa-md">
            <q-btn
              color="positive"
              icon="check_circle"
              label="Confirmar Compra"
              class="full-width"
              size="lg"
              unelevated
              @click="confirmarCheckout"
            />
          </q-card-actions>
        </q-card>

        <q-card flat bordered class="q-mt-md bg-grey-1 shadow-1">
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-xs">Instrucciones de Pago</div>
            <div class="text-caption text-grey-8">
              Realice su pago móvil a los siguientes datos:<br/>
              <strong>Banco:</strong> Banesco (0134)<br/>
              <strong>Teléfono:</strong> 0414-000-0000<br/>
              <strong>RIF:</strong> J-00000000-0<br/><br/>
              Conserve su N° de referencia e ingréselo arriba.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerProductos_ahbb,
  crearProducto_ahbb,
  actualizarProducto_ahbb,
  eliminarProducto_ahbb,
} from '../../servicios/tiendaServicio_ahbb';

const $q = useQuasar();
const cargando = ref(true);
const productos = ref([]);
const filtroEstado = ref('todos');

const mostrarModal = ref(false);
const editando = ref(false);
const formularioBase = {
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  categoria: 'camisas',
  imagen: '',
  estado: 'activo',
};
const productoFom = ref({ ...formularioBase });
const productoActualId = ref(null);

const categorias = ['camisas', 'gorras', 'papeleria', 'accesorios', 'otros'];
const estadosFiltro = [
  { label: 'Todos', value: 'todos' },
  { label: 'Activos', value: 'activo' },
  { label: 'Inactivos', value: 'inactivo' },
];

onMounted(async () => {
  await cargarProductos();
});

const cargarProductos = async () => {
  cargando.value = true;
  try {
    const res = await obtenerProductos_ahbb({ estado: filtroEstado.value });
    productos.value = res.data;
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error cargando productos' });
  } finally {
    cargando.value = false;
  }
};

const abrirModalNuevo = () => {
  editando.value = false;
  productoFom.value = { ...formularioBase };
  productoActualId.value = null;
  mostrarModal.value = true;
};

const abrirModalEditar = (prod) => {
  editando.value = true;
  productoFom.value = {
    nombre: prod.nombre_ahbb,
    descripcion: prod.descripcion_ahbb,
    precio: prod.precio_ahbb,
    stock: prod.stock_ahbb,
    categoria: prod.categoria_ahbb,
    imagen: prod.imagen_ahbb,
    estado: prod.estado_producto_ahbb,
  };
  productoActualId.value = prod.id_producto_ahbb;
  mostrarModal.value = true;
};

const guardarProducto = async () => {
  try {
    if (editando.value) {
      await actualizarProducto_ahbb(productoActualId.value, productoFom.value);
      $q.notify({ type: 'positive', message: 'Producto actualizado' });
    } else {
      await crearProducto_ahbb(productoFom.value);
      $q.notify({ type: 'positive', message: 'Producto creado' });
    }
    mostrarModal.value = false;
    await cargarProductos();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error guardando producto' });
  }
};

const eliminarGarantizado = (id) => {
  $q.dialog({
    title: 'Eliminar producto',
    message: '¿Estás seguro de que deseas eliminar este producto? Si ya tiene compras registradas, se retirará del catálogo para conservar el historial.',
    ok: { color: 'negative', label: 'Eliminar' },
    cancel: true,
  }).onOk(async () => {
    try {
      const respuesta = await eliminarProducto_ahbb(id);
      $q.notify({
        type: 'positive',
        message: respuesta.data?.mensaje || 'Producto eliminado',
      });
      await cargarProductos();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al eliminar',
      });
    }
  });
};

const columnas = [
  { name: 'id', label: 'ID', field: 'id_producto_ahbb', align: 'left', sortable: true },
  { name: 'imagen', label: 'Img', align: 'center' },
  { name: 'nombre', label: 'Nombre', field: 'nombre_ahbb', align: 'left', sortable: true },
  { name: 'categoria', label: 'Categoría', field: 'categoria_ahbb', align: 'left', sortable: true },
  { name: 'precio', label: 'Precio ($)', field: (row) => Number(row.precio_ahbb).toFixed(2), align: 'right', sortable: true },
  { name: 'stock', label: 'Stock', field: 'stock_ahbb', align: 'right', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado_producto_ahbb', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'center' },
];
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">Gestion del Catálogo (Tienda)</div>
      <q-btn color="primary" icon="add" label="Nuevo Producto" @click="abrirModalNuevo" unelevated />
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-5 col-md-4 col-lg-3">
        <q-select
          v-model="filtroEstado"
          :options="estadosFiltro"
          emit-value
          map-options
          outlined
          label="Filtrar por estado"
          @update:model-value="cargarProductos"
        />
      </div>
    </div>

    <q-card flat bordered>
      <q-table
        :rows="productos"
        :columns="columnas"
        row-key="id_producto_ahbb"
        :loading="cargando"
        flat
      >
        <template v-slot:body-cell-imagen="props">
          <q-td :props="props">
            <q-avatar rounded size="40px">
              <img :src="props.row.imagen_ahbb || 'https://via.placeholder.com/40'" />
            </q-avatar>
          </q-td>
        </template>
        <template v-slot:body-cell-categoria="props">
          <q-td :props="props" class="text-capitalize">{{ props.value }}</q-td>
        </template>
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-chip :color="props.value === 'activo' ? 'positive' : 'negative'" text-color="white" size="sm">
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>
        <template v-slot:body-cell-acciones="props">
          <q-td :props="props">
            <q-btn flat round color="primary" icon="edit" @click="abrirModalEditar(props.row)" size="sm" />
            <q-btn flat round color="negative" icon="delete" @click="eliminarGarantizado(props.row.id_producto_ahbb)" size="sm" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Modal Formulario -->
    <q-dialog v-model="mostrarModal" persistent>
      <q-card style="min-width: 400px; max-width: 600px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ editando ? 'Editar Producto' : 'Nuevo Producto' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit="guardarProducto" id="formProducto" class="q-gutter-md q-mt-sm">
            <q-input v-model="productoFom.nombre" label="Nombre" outlined required />
            <q-input v-model="productoFom.descripcion" label="Descripción" type="textarea" outlined autogrow />
            
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model.number="productoFom.precio" label="Precio ($)" type="number" step="0.01" outlined required />
              </div>
              <div class="col-6">
                <q-input v-model.number="productoFom.stock" label="Stock" type="number" outlined required />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-select v-model="productoFom.categoria" :options="categorias" label="Categoría" outlined required class="text-capitalize" />
              </div>
              <div class="col-6">
                <q-select v-model="productoFom.estado" :options="['activo', 'inactivo']" label="Estado" outlined required />
              </div>
            </div>

            <q-input v-model="productoFom.imagen" label="URL de Imagen" outlined />
          </q-form>
        </q-card-section>
        <q-card-actions align="right" class="text-primary q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Guardar" type="submit" form="formProducto" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

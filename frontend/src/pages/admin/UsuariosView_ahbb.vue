<!-- UsuariosView_ahbb.vue — Gestión de usuarios (solo Administrador) -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAutoRefresh_ahbb } from '../../composables/useAutoRefresh_ahbb';
import { 
  obtenerUsuariosPorRol_ahbb, 
  actualizarPerfilUsuario_ahbb, 
  eliminarUsuario_ahbb,
  actualizarEstadoUsuario_ahbb
} from '../../servicios/usuariosServicio_ahbb';
import { registrarUsuario_ahbb } from '../../servicios/autenticacionServicio_ahbb';

const $q = useQuasar();

// Estado
const usuarios_ahbb = ref([]);
const cargando_ahbb = ref(false);
const filtroBusqueda_ahbb = ref('');
const filtroRol_ahbb = ref('todos');

// Dialogos
const mostrarDialogoUsuario_ahbb = ref(false);
const editando_ahbb = ref(false);
const usuarioForm_ahbb = ref({
  id: null,
  nombre: '',
  apellido: '',
  correo: '',
  cedula: '',
  rol: 'ALUMNO',
  contrasena: ''
});

// Columnas de la tabla
const columnas_ahbb = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre Completo', field: row => `${row.nombre} ${row.apellido}`, align: 'left', sortable: true },
  { name: 'cedula', label: 'Cédula', field: 'cedula', align: 'left', sortable: true },
  { name: 'correo', label: 'Correo', field: 'correo', align: 'left', sortable: true },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'center', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estadoCuenta', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', align: 'center' }
];

// Carga de datos
async function cargarUsuarios_ahbb() {
  cargando_ahbb.value = true;
  try {
    const rol = filtroRol_ahbb.value === 'todos' ? null : filtroRol_ahbb.value.toUpperCase();
    usuarios_ahbb.value = await obtenerUsuariosPorRol_ahbb(rol);
  } catch (error) {
    $q.notify({ type: 'negative', mensaje: 'Error al cargar usuarios' });
  } finally {
    cargando_ahbb.value = false;
  }
}

// Filtros computados (Frontend side search)
const usuariosFiltrados_ahbb = computed(() => {
  let res = usuarios_ahbb.value;
  
  if (filtroBusqueda_ahbb.value) {
    const term = filtroBusqueda_ahbb.value.toLowerCase();
    res = res.filter(u => 
      u.nombre.toLowerCase().includes(term) ||
      u.apellido.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      u.cedula.toLowerCase().includes(term) ||
      String(u.id).includes(term)
    );
  }
  
  return res;
});

// CRUD
function prepararNuevoUsuario_ahbb() {
  editando_ahbb.value = false;
  usuarioForm_ahbb.value = {
    id: null,
    nombre: '',
    apellido: '',
    correo: '',
    cedula: '',
    rol: 'alumno',
    contrasena: ''
  };
  mostrarDialogoUsuario_ahbb.value = true;
}

function prepararEdicion_ahbb(usuario) {
  editando_ahbb.value = true;
  usuarioForm_ahbb.value = { ...usuario };
  mostrarDialogoUsuario_ahbb.value = true;
}

async function guardarUsuario_ahbb() {
  try {
    if (editando_ahbb.value) {
      const exito = await actualizarPerfilUsuario_ahbb(usuarioForm_ahbb.value.id, {
        nombre_ahbb: usuarioForm_ahbb.value.nombre,
        apellido_ahbb: usuarioForm_ahbb.value.apellido,
        correo_ahbb: usuarioForm_ahbb.value.correo,
        cedula_ahbb: usuarioForm_ahbb.value.cedula,
      });
      if (exito) $q.notify({ type: 'positive', message: 'Usuario actualizado' });
    } else {
      const res = await registrarUsuario_ahbb({
        ...usuarioForm_ahbb.value,
        rol: usuarioForm_ahbb.value.rol.toUpperCase()
      });
      if (res.exito) {
        $q.notify({ 
          type: 'positive', 
          message: 'Usuario creado exitosamente. Se ha enviado un correo con sus credenciales temporales.',
          icon: 'mail_outline'
        });
      } else throw new Error(res.mensaje);
    }
    mostrarDialogoUsuario_ahbb.value = false;
    await cargarUsuarios_ahbb();
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Error al guardar' });
  }
}

async function confirmarEliminacion_ahbb(usuario) {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Estás seguro de eliminar al usuario ${usuario.nombre} ${usuario.apellido}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const exito = await eliminarUsuario_ahbb(usuario.id);
    if (exito) {
      $q.notify({ type: 'positive', message: 'Usuario eliminado' });
      await cargarUsuarios_ahbb();
    }
  });
}

async function cambiarEstado_ahbb(usuario, nuevoEstado) {
  const exito = await actualizarEstadoUsuario_ahbb(usuario.id, nuevoEstado);
  if (exito) {
    $q.notify({ type: 'positive', message: `Estado cambiado a ${nuevoEstado}` });
    await cargarUsuarios_ahbb();
  }
}

// Watcher en filtroRol: recarga desde el backend al cambiar el filtro
watch(filtroRol_ahbb, async () => {
  await cargarUsuarios_ahbb();
});

// Polling cada 45s: detecta nuevos usuarios creados/modificados automáticamente
useAutoRefresh_ahbb(cargarUsuarios_ahbb, 45_000, false);

onMounted(cargarUsuarios_ahbb);
</script>

<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-primary text-weight-bold">
        <q-icon name="group" class="q-mr-sm" />
        Gestión de Usuarios
      </div>
      <q-space />
      <q-btn 
        color="primary" 
        icon="person_add" 
        label="Nuevo Usuario" 
        unelevated 
        rounded
        @click="prepararNuevoUsuario_ahbb" 
      />
    </div>

    <q-card flat bordered class="rounded-xl shadow-1">
      <q-card-section class="row q-col-gutter-md items-center">
        <div class="col-12 col-sm-6 col-md-4">
          <q-input 
            v-model="filtroBusqueda_ahbb" 
            placeholder="Buscar por nombre, cédula, correo o ID..." 
            outlined 
            dense
            bg-color="white"
            class="rounded-borders"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filtroRol_ahbb"
            :options="['todos', 'admin', 'profesor', 'alumno']"
            label="Filtrar por Rol"
            outlined
            dense
            emit-value
            map-options
            bg-color="white"
          />
        </div>
        <q-space />
        <q-btn 
          flat 
          round 
          icon="refresh" 
          color="grey-7" 
          @click="cargarUsuarios_ahbb" 
          :loading="cargando_ahbb"
        />
      </q-card-section>

      <q-table
        :rows="usuariosFiltrados_ahbb"
        :columns="columnas_ahbb"
        row-key="id"
        :loading="cargando_ahbb"
        flat
        class="bg-transparent"
        no-data-label="No se encontraron usuarios"
      >
        <template v-slot:body-cell-rol="props">
          <q-td :props="props">
            <q-chip 
              :color="props.value === 'admin' ? 'purple-1' : props.value === 'profesor' ? 'blue-1' : 'green-1'" 
              :text-color="props.value === 'admin' ? 'purple-9' : props.value === 'profesor' ? 'blue-9' : 'green-9'"
              dense 
              class="text-weight-bold text-uppercase q-px-md"
              style="font-size: 0.7rem; border-radius: 8px;"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-chip
              :color="props.value === 'ACTIVO' ? 'positive' : 'warning'"
              text-color="white"
              dense
              class="text-weight-bold q-px-md"
              style="font-size: 0.7rem; border-radius: 12px;"
            >
              {{ props.value }}
            </q-chip>
          </q-td>
        </template>

        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" class="q-gutter-x-sm">
            <q-btn flat round size="sm" color="blue" icon="edit" @click="prepararEdicion_ahbb(props.row)">
              <q-tooltip>Editar Perfil</q-tooltip>
            </q-btn>
            <q-btn 
              flat 
              round 
              size="sm" 
              :color="props.row.estadoCuenta === 'ACTIVO' ? 'orange' : 'green'" 
              :icon="props.row.estadoCuenta === 'ACTIVO' ? 'block' : 'check_circle'"
              @click="cambiarEstado_ahbb(props.row, props.row.estadoCuenta === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')"
            >
              <q-tooltip>{{ props.row.estadoCuenta === 'ACTIVO' ? 'Bloquear' : 'Activar' }}</q-tooltip>
            </q-btn>
            <q-btn flat round size="sm" color="red" icon="delete" @click="confirmarEliminacion_ahbb(props.row)">
              <q-tooltip>Eliminar Usuario</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialogo Crear/Editar -->
    <q-dialog v-model="mostrarDialogoUsuario_ahbb" persistent>
      <q-card style="width: 450px; border-radius: 16px">
        <q-card-section class="bg-primary text-white row items-center">
          <div class="text-h6">{{ editando_ahbb ? 'Editar Usuario' : 'Nuevo Usuario' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-form @submit="guardarUsuario_ahbb">
          <q-card-section class="q-gutter-y-md">
            <div class="row q-col-gutter-sm">
              <q-input 
                v-model="usuarioForm_ahbb.nombre" 
                label="Nombre" 
                outlined 
                dense 
                class="col-6"
                :rules="[val => !!val || 'Requerido']"
              />
              <q-input 
                v-model="usuarioForm_ahbb.apellido" 
                label="Apellido" 
                outlined 
                dense 
                class="col-6"
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
            <q-input 
              v-model="usuarioForm_ahbb.cedula" 
              label="Cédula" 
              outlined 
              dense 
              :rules="[val => !!val || 'Requerido']"
            />
            <q-input 
              v-model="usuarioForm_ahbb.correo" 
              label="Correo Electrónico" 
              outlined 
              dense 
              type="email"
              :rules="[val => !!val || 'Correo inválido']"
            />
            
            <q-select
              v-if="!editando_ahbb"
              v-model="usuarioForm_ahbb.rol"
              :options="['admin', 'profesor', 'alumno']"
              label="Rol del Usuario"
              outlined
              dense
            />

            <q-input
              v-if="!editando_ahbb"
              v-model="usuarioForm_ahbb.contrasena"
              label="Contraseña Temporal"
              outlined
              dense
              hint="Si se deja vacío, el sistema generará una"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pb-md q-px-md">
            <q-btn label="Cancelar" color="grey-7" flat v-close-popup />
            <q-btn :label="editando_ahbb ? 'Actualizar' : 'Crear'" color="primary" unelevated rounded type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.rounded-xl { border-radius: 20px; }
.hover-elevate:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}
</style>

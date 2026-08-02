<!--
  RolesAccesosView_jc.vue — Consola de Roles y Accesos (RBAC).

  El administrador crea usuarios asignándoles contraseña y rol, reasigna roles,
  restablece contraseñas y activa o desactiva cuentas. Cada acción queda
  registrada en la bitácora de auditoría del sistema.

  La matriz de permisos que se muestra no está escrita a mano en esta vista: la
  envía el backend desde el mismo catálogo que usan los guards, así que siempre
  refleja los permisos reales.
-->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  obtenerCatalogoRoles_jc,
  listarUsuariosRbac_jc,
  crearUsuarioRbac_jc,
  asignarRol_jc,
  restablecerContrasena_jc,
  cambiarEstadoCuenta_jc,
} from '../../servicios/seguridadServicio_jc';

const $q = useQuasar();

const catalogo_jc = ref({ roles: [], permisos: [] });
const datos_jc = ref({ total: 0, porRol: [], usuarios: [] });
const cargando_jc = ref(true);
const pestana_jc = ref('usuarios');

const filtros_jc = ref({ rol_jc: null, estado_jc: null, busqueda_jc: '' });

// Diálogos
const dialogoCrear_jc = ref(false);
const dialogoContrasena_jc = ref(false);
const guardando_jc = ref(false);
const usuarioSeleccionado_jc = ref(null);

const formularioCrear_jc = ref({
  nombre_jc: '',
  apellido_jc: '',
  cedula_jc: '',
  correo_jc: '',
  contrasena_jc: '',
  rol_jc: 'ALUMNO',
  requiereCambioContrasena_jc: true,
});

const formularioContrasena_jc = ref({
  contrasena_jc: '',
  requiereCambioContrasena_jc: true,
});

const ESTADOS_JC = ['ACTIVO', 'INACTIVO', 'PENDIENTE_APROBACION'];

const columnas_jc = [
  { name: 'cedula', label: 'Cédula', field: 'cedula_ahbb', align: 'left', sortable: true },
  {
    name: 'nombre',
    label: 'Usuario',
    field: (fila_jc) => `${fila_jc.apellido_ahbb}, ${fila_jc.nombre_ahbb}`,
    align: 'left',
    sortable: true,
  },
  { name: 'correo', label: 'Correo', field: 'correo_ahbb', align: 'left', sortable: true },
  { name: 'rol', label: 'Rol', field: 'rol_ahbb', align: 'center', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estadoCuenta_ahbb', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
];

const opcionesRol_jc = computed(() =>
  catalogo_jc.value.roles.map((rol_jc) => ({
    label: rol_jc.etiqueta,
    value: rol_jc.valor,
    descripcion: rol_jc.descripcion,
  })),
);

const presentacionRol_jc = (valor_jc) =>
  catalogo_jc.value.roles.find((rol_jc) => rol_jc.valor === valor_jc) ?? {
    etiqueta: valor_jc,
    color: 'grey',
    icono: 'person',
  };

const cargar_jc = async () => {
  cargando_jc.value = true;
  try {
    const filtrosLimpios_jc = Object.fromEntries(
      Object.entries(filtros_jc.value).filter(([, valor_jc]) => valor_jc),
    );
    [catalogo_jc.value, datos_jc.value] = await Promise.all([
      obtenerCatalogoRoles_jc(),
      listarUsuariosRbac_jc(filtrosLimpios_jc),
    ]);
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudieron cargar los usuarios.' });
  } finally {
    cargando_jc.value = false;
  }
};

const abrirCreacion_jc = () => {
  formularioCrear_jc.value = {
    nombre_jc: '',
    apellido_jc: '',
    cedula_jc: '',
    correo_jc: '',
    contrasena_jc: '',
    rol_jc: 'ALUMNO',
    requiereCambioContrasena_jc: true,
  };
  dialogoCrear_jc.value = true;
};

const crear_jc = async () => {
  const formulario_jc = formularioCrear_jc.value;
  const faltantes_jc = ['nombre_jc', 'apellido_jc', 'cedula_jc', 'correo_jc'].filter(
    (campo_jc) => !String(formulario_jc[campo_jc] ?? '').trim(),
  );
  if (faltantes_jc.length) {
    $q.notify({ type: 'warning', message: 'Completa nombre, apellido, cédula y correo.' });
    return;
  }
  if (String(formulario_jc.contrasena_jc).length < 6) {
    $q.notify({ type: 'warning', message: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  guardando_jc.value = true;
  const resultado_jc = await crearUsuarioRbac_jc(formulario_jc);
  guardando_jc.value = false;

  $q.notify({
    type: resultado_jc.exito ? 'positive' : 'negative',
    message: resultado_jc.mensaje,
    timeout: 5000,
  });
  if (resultado_jc.exito) {
    dialogoCrear_jc.value = false;
    cargar_jc();
  }
};

const cambiarRol_jc = (usuario_jc, rolNuevo_jc) => {
  if (rolNuevo_jc === usuario_jc.rol_ahbb) return;

  $q.dialog({
    title: 'Cambiar rol',
    message: `${usuario_jc.nombre_ahbb} ${usuario_jc.apellido_ahbb} pasará a tener el rol ${presentacionRol_jc(rolNuevo_jc).etiqueta}. ¿Continuar?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Cambiar rol', color: 'primary' },
  }).onOk(async () => {
    const resultado_jc = await asignarRol_jc(usuario_jc.id_usuario_ahbb, rolNuevo_jc);
    $q.notify({
      type: resultado_jc.exito ? 'positive' : 'negative',
      message: resultado_jc.mensaje,
      timeout: 5000,
    });
    cargar_jc();
  });
};

const abrirContrasena_jc = (usuario_jc) => {
  usuarioSeleccionado_jc.value = usuario_jc;
  formularioContrasena_jc.value = { contrasena_jc: '', requiereCambioContrasena_jc: true };
  dialogoContrasena_jc.value = true;
};

const guardarContrasena_jc = async () => {
  if (String(formularioContrasena_jc.value.contrasena_jc).length < 6) {
    $q.notify({ type: 'warning', message: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  guardando_jc.value = true;
  const resultado_jc = await restablecerContrasena_jc(
    usuarioSeleccionado_jc.value.id_usuario_ahbb,
    formularioContrasena_jc.value,
  );
  guardando_jc.value = false;

  $q.notify({
    type: resultado_jc.exito ? 'positive' : 'negative',
    message: resultado_jc.mensaje,
  });
  if (resultado_jc.exito) dialogoContrasena_jc.value = false;
};

const alternarEstado_jc = async (usuario_jc) => {
  const estadoNuevo_jc =
    usuario_jc.estadoCuenta_ahbb === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const resultado_jc = await cambiarEstadoCuenta_jc(
    usuario_jc.id_usuario_ahbb,
    estadoNuevo_jc,
  );
  $q.notify({
    type: resultado_jc.exito ? 'positive' : 'negative',
    message: resultado_jc.mensaje,
  });
  cargar_jc();
};

onMounted(cargar_jc);
</script>

<template>
  <q-page padding>
    <div class="text-h5 text-weight-bold q-mb-xs">Roles y Accesos (RBAC)</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Creación de usuarios, asignación de roles y control de accesos — Seguridad (JC).
      Toda acción realizada aquí queda registrada en la
      <strong>Auditoría del Sistema</strong>.
    </div>

    <!-- Tarjetas por rol: cuántos usuarios hay de cada tipo -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div v-for="rol_jc in datos_jc.porRol" :key="rol_jc.valor" class="col-6 col-md-3">
        <q-card flat bordered>
          <q-card-section class="row items-center q-py-sm">
            <q-avatar :color="rol_jc.color" text-color="white" :icon="rol_jc.icono" size="38px" />
            <div class="q-ml-sm">
              <div class="text-h6 text-weight-bold">{{ rol_jc.total }}</div>
              <div class="text-caption text-grey-7">{{ rol_jc.etiqueta }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-tabs v-model="pestana_jc" dense align="left" class="text-primary q-mb-sm">
      <q-tab name="usuarios" icon="group" label="Usuarios" />
      <q-tab name="permisos" icon="shield" label="Matriz de permisos" />
    </q-tabs>
    <q-separator class="q-mb-md" />

    <!-- ── Pestaña: usuarios ── -->
    <template v-if="pestana_jc === 'usuarios'">
      <div class="row q-col-gutter-sm q-mb-sm items-center">
        <div class="col-12 col-md-3">
          <q-input
            v-model="filtros_jc.busqueda_jc"
            label="Buscar por nombre, correo o cédula"
            outlined
            dense
            clearable
            debounce="400"
            @update:model-value="cargar_jc"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-6 col-md-2">
          <q-select
            v-model="filtros_jc.rol_jc"
            :options="opcionesRol_jc"
            emit-value
            map-options
            clearable
            label="Rol"
            outlined
            dense
            @update:model-value="cargar_jc"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-select
            v-model="filtros_jc.estado_jc"
            :options="ESTADOS_JC"
            clearable
            label="Estado"
            outlined
            dense
            @update:model-value="cargar_jc"
          />
        </div>
        <div class="col-12 col-md-5 text-right">
          <q-btn color="primary" icon="person_add" label="Nuevo usuario" @click="abrirCreacion_jc" />
        </div>
      </div>

      <q-table
        :rows="datos_jc.usuarios"
        :columns="columnas_jc"
        row-key="id_usuario_ahbb"
        :loading="cargando_jc"
        flat
        bordered
        dense
        :rows-per-page-options="[10, 25, 50, 0]"
      >
        <template #body-cell-rol="props">
          <q-td :props="props" class="text-center">
            <q-select
              :model-value="props.row.rol_ahbb"
              :options="opcionesRol_jc"
              emit-value
              map-options
              dense
              outlined
              options-dense
              style="min-width: 175px"
              @update:model-value="(rol_jc) => cambiarRol_jc(props.row, rol_jc)"
            >
              <template #prepend>
                <q-icon
                  :name="presentacionRol_jc(props.row.rol_ahbb).icono"
                  :color="presentacionRol_jc(props.row.rol_ahbb).color"
                  size="18px"
                />
              </template>
            </q-select>
          </q-td>
        </template>

        <template #body-cell-estado="props">
          <q-td :props="props" class="text-center">
            <q-chip
              dense
              size="sm"
              :color="props.row.estadoCuenta_ahbb === 'ACTIVO' ? 'green-1' : 'orange-1'"
              :text-color="props.row.estadoCuenta_ahbb === 'ACTIVO' ? 'green-9' : 'orange-9'"
            >
              {{ props.row.estadoCuenta_ahbb }}
            </q-chip>
            <q-badge
              v-if="props.row.requiereCambioContrasena_ahbb"
              color="amber-8"
              class="q-ml-xs"
              label="cambio pendiente"
            />
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-center">
            <q-btn
              flat
              round
              dense
              size="sm"
              color="primary"
              icon="key"
              @click="abrirContrasena_jc(props.row)"
            >
              <q-tooltip>Restablecer contraseña</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              size="sm"
              :color="props.row.estadoCuenta_ahbb === 'ACTIVO' ? 'negative' : 'positive'"
              :icon="props.row.estadoCuenta_ahbb === 'ACTIVO' ? 'block' : 'check_circle'"
              @click="alternarEstado_jc(props.row)"
            >
              <q-tooltip>
                {{ props.row.estadoCuenta_ahbb === 'ACTIVO' ? 'Desactivar cuenta' : 'Activar cuenta' }}
              </q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </template>

    <!-- ── Pestaña: matriz de permisos ── -->
    <template v-else>
      <q-banner dense rounded class="bg-blue-1 text-blue-9 q-mb-md">
        <template #avatar><q-icon name="info" /></template>
        Esta matriz la envía el servidor desde el mismo catálogo que aplican los guards de
        la API: refleja los permisos reales, no una descripción escrita aparte.
      </q-banner>

      <div class="row q-col-gutter-sm q-mb-md">
        <div v-for="rol_jc in catalogo_jc.roles" :key="rol_jc.valor" class="col-12 col-md-6">
          <q-card flat bordered class="full-height">
            <q-card-section class="row items-center q-pb-xs">
              <q-avatar :color="rol_jc.color" text-color="white" :icon="rol_jc.icono" size="32px" />
              <div class="text-subtitle2 text-weight-bold q-ml-sm">{{ rol_jc.etiqueta }}</div>
            </q-card-section>
            <q-card-section class="q-pt-none text-caption text-grey-8">
              {{ rol_jc.descripcion }}
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card v-for="modulo_jc in catalogo_jc.permisos" :key="modulo_jc.modulo" flat bordered class="q-mb-sm">
        <q-card-section class="text-subtitle2 text-weight-bold q-pb-xs">
          {{ modulo_jc.modulo }}
        </q-card-section>
        <q-markup-table flat dense>
          <thead>
            <tr class="bg-grey-2">
              <th class="text-left">Acción</th>
              <th class="text-left">Roles autorizados</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="permiso_jc in modulo_jc.permisos" :key="permiso_jc.accion">
              <td>{{ permiso_jc.accion }}</td>
              <td>
                <q-chip
                  v-for="rol_jc in permiso_jc.roles"
                  :key="rol_jc"
                  dense
                  size="sm"
                  :color="`${presentacionRol_jc(rol_jc).color}-1`"
                  :text-color="`${presentacionRol_jc(rol_jc).color}-9`"
                  :icon="presentacionRol_jc(rol_jc).icono"
                >
                  {{ presentacionRol_jc(rol_jc).etiqueta }}
                </q-chip>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>
    </template>

    <!-- Diálogo: crear usuario -->
    <q-dialog v-model="dialogoCrear_jc" persistent>
      <q-card style="min-width: 560px; max-width: 92vw">
        <q-card-section class="text-h6">Nuevo usuario</q-card-section>
        <q-card-section class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input v-model="formularioCrear_jc.nombre_jc" label="Nombre *" outlined dense />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="formularioCrear_jc.apellido_jc" label="Apellido *" outlined dense />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="formularioCrear_jc.cedula_jc" label="Cédula *" outlined dense hint="Ej. V-20000001" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="formularioCrear_jc.correo_jc" type="email" label="Correo *" outlined dense />
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="formularioCrear_jc.contrasena_jc"
              type="text"
              label="Contraseña *"
              outlined
              dense
              hint="Mínimo 6 caracteres"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="formularioCrear_jc.rol_jc"
              :options="opcionesRol_jc"
              emit-value
              map-options
              label="Rol *"
              outlined
              dense
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption class="text-grey-7">
                      {{ scope.opt.descripcion }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <div class="col-12">
            <q-toggle
              v-model="formularioCrear_jc.requiereCambioContrasena_jc"
              label="Obligar a cambiar la contraseña en el primer acceso"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Crear usuario" :loading="guardando_jc" @click="crear_jc" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo: restablecer contraseña -->
    <q-dialog v-model="dialogoContrasena_jc">
      <q-card style="min-width: 420px">
        <q-card-section class="text-h6">Restablecer contraseña</q-card-section>
        <q-card-section>
          <div class="text-caption text-grey-8 q-mb-sm" v-if="usuarioSeleccionado_jc">
            {{ usuarioSeleccionado_jc.nombre_ahbb }} {{ usuarioSeleccionado_jc.apellido_ahbb }} ·
            {{ usuarioSeleccionado_jc.correo_ahbb }}
          </div>
          <q-input
            v-model="formularioContrasena_jc.contrasena_jc"
            label="Nueva contraseña *"
            outlined
            dense
            hint="Mínimo 6 caracteres. Nunca se guarda en claro ni en la bitácora."
          />
          <q-toggle
            v-model="formularioContrasena_jc.requiereCambioContrasena_jc"
            class="q-mt-sm"
            label="Obligar a cambiarla en el próximo acceso"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Restablecer" :loading="guardando_jc" @click="guardarContrasena_jc" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Quasar App </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAutenticacionStore_ahbb } from '../stores/autenticacionStore_ahbb';
import EssentialLink from 'components/EssentialLink.vue';

const authStore_ahbb = useAutenticacionStore_ahbb();

const linksList = computed(() => {
  const base_ahbb = [
    { title: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
    { title: 'Horarios', icon: 'schedule', link: '/horarios' },
    { title: 'Mi Perfil', icon: 'person', link: '/perfil' },
  ];

  if (authStore_ahbb.esAdmin_ahbb) {
    return [
      ...base_ahbb,
      { title: 'Usuarios', icon: 'people', link: '/admin/usuarios' },
      { title: 'Cursos', icon: 'menu_book', link: '/cursos' },
      { title: 'Inscripciones', icon: 'assignment', link: '/inscripciones' },
      { title: 'Tienda (Admin)', icon: 'shopping_bag', link: '/admin/tienda' },
    ];
  }

  if (authStore_ahbb.esProfesor_ahbb) {
    return [
      ...base_ahbb,
      { title: 'Mis Cursos', icon: 'menu_book', link: '/cursos' },
      { title: 'Mis Alumnos', icon: 'groups', link: '/profesor/mis-alumnos' },
      { title: 'Firma Digital', icon: 'gesture', link: '/profesor/firma-digital' },
    ];
  }

  if (authStore_ahbb.esAlumno_ahbb) {
    return [
      ...base_ahbb,
      { title: 'Oferta Académica', icon: 'school', link: '/alumno/oferta-academica' },
      { title: 'Mis Inscripciones', icon: 'assignment_turned_in', link: '/alumno/mis-inscripciones' },
      { title: 'Historial Académico', icon: 'history_edu', link: '/alumno/historial' },
      { title: 'Mis Certificados', icon: 'card_membership', link: '/alumno/mis-certificados' },
    ];
  }

  return base_ahbb;
});

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

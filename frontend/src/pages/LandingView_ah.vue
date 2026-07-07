<!--
  LandingView_ah.vue — Vista 1: Landing Page de Academia H&B
  Compone todas las secciones de la landing según la estructura
  obligatoria (a–i): Hero, Beneficios,
  Galería, Testimonios, Tienda de Merch y FAQ.
  El Footer se renderiza en App.vue (persistente en ambas vistas).
-->
<script setup>
// Importar todos los componentes de la landing page
import Hero_ah from '../components/landing/Hero_ah.vue';
import Beneficios_ah from '../components/landing/Beneficios_ah.vue';
import Galeria_ah from '../components/landing/Galeria_ah.vue';
import Testimonios_ah from '../components/landing/Testimonios_ah.vue';
import DetallesAdicionales_ah from '../components/landing/DetallesAdicionales_ah.vue';
import EquipoDesarrollo_ah from '../components/landing/EquipoDesarrollo_ah.vue';
import Faq_ah from '../components/landing/Faq_ah.vue';
</script>

<template>
  <!-- Vista principal de la landing page -->
  <main id="landingView_ah" class="landing-view_ah">
    <!-- a) + b) Encabezado, subtítulo y CTA principal -->
    <Hero_ah />

    <!-- c) Sección de beneficios clave de la academia -->
    <Beneficios_ah />

    <!-- d) Galería de imágenes de la comunidad académica -->
    <Galeria_ah />

    <!-- f) Testimonios de estudiantes/instructores -->
    <Testimonios_ah />

    <!-- g) Tienda de Merch oficial (próximamente) -->
    <DetallesAdicionales_ah />

    <!-- Equipo de Desarrollo -->
    <EquipoDesarrollo_ah />

    <!-- h) Preguntas frecuentes (FAQ acordeón) -->
    <Faq_ah />

    <!-- i) Footer se renderiza en App.vue -->
  </main>
</template>

<style scoped>
/* La landing view no requiere estilos propios */
/* Cada componente maneja sus propios estilos */
.landing-view_ah {
  min-height: 100vh;
}
</style>

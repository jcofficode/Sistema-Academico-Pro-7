<!--
  Faq_ah.vue — Sección h) de la landing page
  Preguntas frecuentes (FAQ) con patrón de acordeón.
  Incluye preguntas sobre la academia, cursos, certificaciones y merch.
-->
<script setup>
import { ref } from 'vue';

const preguntasFrecuentes_ah = [
  {
    pregunta: '¿Cómo me inscribo en un curso?',
    respuesta:
      'Primero debes registrarte en la plataforma creando una cuenta como alumno. Una vez dentro, ve a la sección "Oferta Académica" donde podrás explorar todos los cursos disponibles y solicitar tu inscripción directamente.',
  },
  {
    pregunta: '¿Qué cursos ofrecen actualmente?',
    respuesta:
      'Ofrecemos cursos de tecnología como Fundamentos de JavaScript, Vue.js 3 Avanzado, Base de Datos SQL, Node.js y Express, entre otros. Nuestro catálogo se actualiza constantemente con nuevas opciones.',
  },
  {
    pregunta: '¿Cómo obtengo mi certificado al completar un curso?',
    respuesta:
      'Al finalizar satisfactoriamente un curso, tu profesor valida tu progreso y el administrador emite tu certificado digital. Puedes descargarlo desde la sección "Mis Certificados" en tu panel de alumno.',
  },
  {
    pregunta: '¿Qué son las prelaciones entre cursos?',
    respuesta:
      'Las prelaciones son requisitos previos. Algunos cursos avanzados requieren que hayas completado un curso introductorio antes. Por ejemplo, Vue.js 3 Avanzado requiere haber aprobado Fundamentos de JavaScript. El sistema te indica automáticamente qué prelaciones aplican.',
  },
  {
    pregunta: '¿Cuántos estudiantes hay por clase?',
    respuesta:
      'Cada curso tiene un tope máximo de estudiantes para garantizar una atención personalizada. Generalmente los cupos van de 5 a 30 alumnos por curso, dependiendo de la materia.',
  },
  {
    pregunta: '¿Puedo comprar merch de la academia?',
    respuesta:
      'Estamos trabajando en nuestra tienda oficial de merch donde podrás adquirir franelas, chaquetas, tazas y accesorios con el logo de Academia H&B. Los estudiantes activos tendrán un 15% de descuento. ¡Muy pronto estará disponible!',
  },
];

/**
 * preguntaActiva_ah — Índice de la pregunta expandida
 * null significa que ninguna está abierta
 */
const preguntaActiva_ah = ref(null);

/**
 * togglePregunta_ah — Alterna la visibilidad de una respuesta
 */
const togglePregunta_ah = (indice) => {
  preguntaActiva_ah.value = preguntaActiva_ah.value === indice ? null : indice;
};
</script>

<template>
  <!-- Sección de preguntas frecuentes -->
  <section id="faq_ah" class="seccion_ah faq_ah">
    <div class="contenedor_ah">
      <!-- Título de la sección -->
      <div class="titulo-seccion_ah">
        <h2>Preguntas Frecuentes</h2>
        <p>
          Resolvemos tus dudas más comunes sobre nuestros cursos, certificaciones y plataforma
        </p>
      </div>

      <!-- Lista de preguntas tipo acordeón -->
      <div class="faq-lista_ah">
        <div
          v-for="(faq, indice) in preguntasFrecuentes_ah"
          :key="indice"
          class="faq-item_ah"
          :class="{ 'faq-item-activo_ah': preguntaActiva_ah === indice }"
        >
          <!-- Botón de la pregunta (cabecera del acordeón) -->
          <button
            class="faq-pregunta_ah"
            :id="`faqPregunta_ah_${indice}`"
            @click="togglePregunta_ah(indice)"
            :aria-expanded="preguntaActiva_ah === indice"
          >
            <span class="faq-pregunta-texto_ah">{{ faq.pregunta }}</span>
            <!-- Ícono de expandir/colapsar -->
            <span
              class="faq-icono_ah"
              :class="{ 'faq-icono-rotado_ah': preguntaActiva_ah === indice }"
            >
              +
            </span>
          </button>

          <!-- Respuesta expandible con transición -->
          <div
            class="faq-respuesta-contenedor_ah"
            :class="{
              'faq-respuesta-visible_ah': preguntaActiva_ah === indice,
            }"
          >
            <p class="faq-respuesta_ah">{{ faq.respuesta }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq_ah {
  background: var(--color-fondo_ah);
}

.faq-lista_ah {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--espacio-md_ah);
}

.faq-item_ah {
  background: var(--color-fondo-tarjeta_ah);
  border-radius: var(--radio-lg_ah);
  border: 1px solid var(--color-borde_ah);
  overflow: hidden;
  transition: all var(--transicion-media_ah);
}

.faq-item-activo_ah {
  border-color: var(--color-acento_ah);
  box-shadow: var(--sombra-suave_ah);
}

.faq-pregunta_ah {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--espacio-lg_ah) var(--espacio-xl_ah);
  text-align: left;
  color: var(--color-primario_ah);
  font-weight: 600;
  font-size: 1rem;
  transition: color var(--transicion-rapida_ah);
}

.faq-pregunta_ah:hover {
  color: var(--color-acento_ah);
}

.faq-pregunta-texto_ah {
  flex: 1;
  padding-right: var(--espacio-md_ah);
}

.faq-icono_ah {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--color-acento_ah);
  transition: transform var(--transicion-media_ah);
  flex-shrink: 0;
}

.faq-icono-rotado_ah {
  transform: rotate(45deg);
}

.faq-respuesta-contenedor_ah {
  max-height: 0;
  overflow: hidden;
  transition:
    max-height var(--transicion-media_ah),
    padding var(--transicion-media_ah);
}

.faq-respuesta-visible_ah {
  max-height: 300px;
}

.faq-respuesta_ah {
  padding: 0 var(--espacio-xl_ah) var(--espacio-lg_ah);
  color: var(--color-texto-claro_ah);
  font-size: 0.9rem;
  line-height: 1.7;
}
</style>

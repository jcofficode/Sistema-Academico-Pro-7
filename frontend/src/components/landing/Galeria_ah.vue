<!--
  Galeria_ah.vue — Sección d) de la landing page
  Muestra imágenes de la comunidad académica de Academia H&B en acción.
  Layout tipo masonry/grid con efecto hover.
-->
<script setup>
const imagenesGaleria_ah = [
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
    titulo: 'Clases colaborativas',
    categoria: 'Aprendizaje',
  },
  {
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop',
    titulo: 'Sesiones de estudio',
    categoria: 'Academia',
  },
  {
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=400&fit=crop',
    titulo: 'Entrega de certificados',
    categoria: 'Certificaciones',
  },
  {
    url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop',
    titulo: 'Programando en clase',
    categoria: 'Tecnología',
  },
  {
    url: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=400&h=500&fit=crop',
    titulo: 'Proyectos prácticos',
    categoria: 'Práctica',
  },
  {
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
    titulo: 'Graduación de la cohorte',
    categoria: 'Logros',
  },
];
</script>

<template>
  <!-- Sección de galería visual -->
  <section id="galeria_ah" class="seccion_ah galeria_ah">
    <div class="contenedor_ah">
      <!-- Título de la sección -->
      <div class="titulo-seccion_ah">
        <h2>Nuestra Comunidad en Acción</h2>
        <p>
          Estudiantes y egresados construyendo su futuro profesional en
          Academia H&B
        </p>
      </div>

      <!-- Grid de galería tipo masonry -->
      <div class="galeria-grid_ah">
        <div
          v-for="(imagen, indice) in imagenesGaleria_ah"
          :key="indice"
          class="galeria-item_ah"
          :class="`galeria-item-${indice + 1}_ah`"
        >
          <img
            :src="imagen.url"
            :alt="imagen.titulo"
            class="galeria-imagen_ah"
            loading="lazy"
          />
          <!-- Overlay con información al hacer hover -->
          <div class="galeria-overlay_ah">
            <span class="galeria-categoria_ah">{{ imagen.categoria }}</span>
            <h4 class="galeria-titulo_ah">{{ imagen.titulo }}</h4>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.galeria_ah {
  background: var(--color-fondo-seccion_ah);
}

.galeria-grid_ah {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 220px;
  gap: var(--espacio-md_ah);
}

.galeria-item-1_ah {
  grid-row: span 2;
}

.galeria-item-4_ah {
  grid-column: span 2;
}

.galeria-item_ah {
  position: relative;
  border-radius: var(--radio-lg_ah);
  overflow: hidden;
  cursor: pointer;
}

.galeria-imagen_ah {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transicion-lenta_ah);
}

.galeria-item_ah:hover .galeria-imagen_ah {
  transform: scale(1.1);
}

.galeria-overlay_ah {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--espacio-lg_ah);
  opacity: 0;
  transition: opacity var(--transicion-media_ah);
}

.galeria-item_ah:hover .galeria-overlay_ah {
  opacity: 1;
}

.galeria-categoria_ah {
  display: inline-block;
  background: var(--color-acento_ah);
  color: white;
  padding: 2px 10px;
  border-radius: var(--radio-completo_ah);
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
  margin-bottom: var(--espacio-xs_ah);
}

.galeria-titulo_ah {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .galeria-grid_ah {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 180px;
  }

  .galeria-item-1_ah {
    grid-row: span 1;
  }

  .galeria-item-4_ah {
    grid-column: span 1;
  }
}

@media (max-width: 480px) {
  .galeria-grid_ah {
    grid-template-columns: 1fr;
    grid-auto-rows: 200px;
  }
}
</style>

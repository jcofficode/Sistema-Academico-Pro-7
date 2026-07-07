<!--
  DetallesAdicionales_ah.vue — Sección g) de la landing page
  Sección dedicada a la Tienda de Merch oficial de Academia H&B.
  Presenta los productos exclusivos con un diseño atractivo tipo catálogo.
-->
<script setup>

const productosMerch_ah = [
  {
    nombre: 'Suéter Azul H&B',
    descripcion:
      'Suéter cómodo y abrigador con el logo oficial de Academia H&B. Ideal para el frío. Color Azul Oficial.',
    precio: '$25.00',
    etiqueta: 'Más vendido',
    imagen: '/img/SueterH&B_Azul.jpg',
  },
  {
    nombre: 'Suéter Mostaza H&B',
    descripcion:
      'Suéter cómodo estilo urbano con el logo bordado de Academia H&B. Color Mostaza.',
    precio: '$25.00',
    etiqueta: 'Nuevo',
    imagen: '/img/SueterH&B_mostaza.jpg',
  },
  {
    nombre: 'Franela Azul H&B',
    descripcion:
      'Franela fresca 100% algodón con el logo de Academia H&B. Perfecta para el día a día.',
    precio: '$15.00',
    etiqueta: 'Popular',
    imagen: '/img/franelaH&B_Azul.jpg',
  },
  {
    nombre: 'Lapicero Azul H&B',
    descripcion:
      'Lapicero elegante con acabado premium y el logo grabado de Academia H&B. Color Azul.',
    precio: '$2.50',
    etiqueta: 'Accesorio',
    imagen: '/img/lapiceroH&B_Azul.jpg',
  },
];
</script>

<template>
  <!-- Sección de tienda de merch -->
  <section id="merch_ah" class="seccion_ah merch_ah">
    <div class="contenedor_ah">
      <div class="merch-layout_ah">
        <!-- Columna izquierda: imagen promocional -->
        <div class="merch-imagen-col_ah">
          <div class="merch-imagen-wrapper_ah">
            <img
              src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=700&fit=crop"
              alt="Merch oficial de Academia H&B"
              class="merch-img_ah"
              loading="lazy"
            />

          </div>
        </div>

        <!-- Columna derecha: contenido -->
        <div class="merch-contenido_ah">
          <span class="merch-etiqueta_ah">🛒 Tienda de Merch</span>
          <h2 class="merch-titulo_ah">
            Viste el orgullo de ser parte de
            <span class="merch-titulo-resaltado_ah">Academia H&B</span>
          </h2>
          <p class="merch-descripcion_ah">
            Demuestra tus logros y certificaciones con merch exclusivo diseñado
            para quienes viven la tecnología. Materiales premium,
            personalización disponible y envío a todo el país.
          </p>

          <!-- Grid de productos -->
          <div class="merch-productos_ah">
            <div
              v-for="(producto, indice) in productosMerch_ah"
              :key="indice"
              class="merch-producto_ah"
            >
              <!-- Imagen del producto -->
              <div class="producto-imagen-wrapper_ah">
                <img
                  :src="producto.imagen"
                  :alt="producto.nombre"
                  class="producto-imagen_ah"
                  loading="lazy"
                />
                <span class="producto-etiqueta_ah">{{ producto.etiqueta }}</span>
              </div>
              <!-- Detalles del producto -->
              <div class="producto-detalles_ah">
                <h4 class="producto-nombre_ah">{{ producto.nombre }}</h4>
                <p class="producto-descripcion_ah">{{ producto.descripcion }}</p>
                <span class="producto-precio_ah">{{ producto.precio }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.merch_ah {
  background: linear-gradient(
    180deg,
    var(--color-fondo-seccion_ah) 0%,
    #f0f4ff 100%
  );
}

.merch-layout_ah {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--espacio-3xl_ah);
  align-items: center;
}

/* — Imagen promocional — */
.merch-imagen-col_ah {
  position: relative;
}

.merch-imagen-wrapper_ah {
  position: relative;
}

.merch-img_ah {
  width: 100%;
  height: 520px;
  object-fit: cover;
  border-radius: var(--radio-xl_ah);
  box-shadow: var(--sombra-fuerte_ah);
}

.merch-badge_ah {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 0.6rem 1rem;
  border-radius: var(--radio-completo_ah);
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-icono_ah {
  font-size: 1.1rem;
}

.merch-descuento_ah {
  position: absolute;
  bottom: -15px;
  right: -15px;
  background: var(--color-acento_ah);
  color: white;
  padding: var(--espacio-lg_ah);
  border-radius: var(--radio-xl_ah);
  text-align: center;
  box-shadow: var(--sombra-acento_ah);
  animation: fadeInUp_ah 0.8s ease 0.3s forwards;
  opacity: 0;
}

.descuento-numero_ah {
  display: block;
  font-family: var(--fuente-titulo_ah);
  font-size: 1.75rem;
  font-weight: 800;
}

.descuento-texto_ah {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.9;
  display: block;
  max-width: 120px;
}

/* — Contenido — */
.merch-etiqueta_ah {
  display: inline-block;
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-acento_ah);
  padding: 0.4rem 1rem;
  border-radius: var(--radio-completo_ah);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: var(--espacio-md_ah);
}

.merch-titulo_ah {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: var(--espacio-md_ah);
  color: var(--color-primario_ah);
  line-height: 1.3;
}

.merch-titulo-resaltado_ah {
  color: var(--color-acento_ah);
}

.merch-descripcion_ah {
  color: var(--color-texto-claro_ah);
  line-height: 1.7;
  margin-bottom: var(--espacio-xl_ah);
}

/* — Grid de productos — */
.merch-productos_ah {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--espacio-md_ah);
  margin-bottom: var(--espacio-xl_ah);
}

.merch-producto_ah {
  background: white;
  border-radius: var(--radio-lg_ah);
  border: 1px solid var(--color-borde_ah);
  transition: all var(--transicion-media_ah);
  overflow: hidden;
}

.merch-producto_ah:hover {
  border-color: var(--color-acento_ah);
  box-shadow: var(--sombra-suave_ah);
  transform: translateY(-3px);
}

.merch-producto_ah:hover .producto-imagen_ah {
  transform: scale(1.05);
}

/* — Imagen del producto — */
.producto-imagen-wrapper_ah {
  position: relative;
  overflow: hidden;
  height: 160px;
  background: #f8fafc;
}

.producto-imagen_ah {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.producto-etiqueta_ah {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 3px 10px;
  border-radius: var(--radio-completo_ah);
  font-size: 0.7rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

/* — Detalles del producto — */
.producto-detalles_ah {
  padding: var(--espacio-md_ah) var(--espacio-lg_ah) var(--espacio-lg_ah);
}

.producto-nombre_ah {
  font-size: 1rem;
  color: var(--color-primario_ah);
  margin-bottom: 4px;
  font-weight: 700;
}

.producto-descripcion_ah {
  font-size: 0.8rem;
  color: var(--color-texto-claro_ah);
  line-height: 1.5;
  margin-bottom: var(--espacio-sm_ah);
}

.producto-precio_ah {
  font-family: var(--fuente-titulo_ah);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-acento_ah);
}

/* — CTA Proximamente — */
.merch-proximamente_ah {
  display: flex;
  align-items: center;
  gap: var(--espacio-md_ah);
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.08),
    rgba(245, 158, 11, 0.08)
  );
  border: 1px dashed rgba(245, 158, 11, 0.4);
  padding: var(--espacio-lg_ah) var(--espacio-xl_ah);
  border-radius: var(--radio-lg_ah);
}

.proximamente-icono_ah {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.proximamente-titulo_ah {
  display: block;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-primario_ah);
  margin-bottom: 2px;
}

.proximamente-texto_ah {
  font-size: 0.8rem;
  color: var(--color-texto-claro_ah);
}

/* — Responsive — */
@media (max-width: 968px) {
  .merch-layout_ah {
    grid-template-columns: 1fr;
    gap: var(--espacio-xl_ah);
  }

  .merch-img_ah {
    height: 350px;
  }

  .merch-descuento_ah {
    right: 10px;
    bottom: -10px;
  }
}

@media (max-width: 480px) {
  .merch-productos_ah {
    grid-template-columns: 1fr;
  }
}
</style>

<!--
  Footer_ah.vue — Pie de página de Academia H&B
  Contiene: información de contacto, enlaces rápidos,
  redes sociales y derechos reservados.
  Se muestra en todas las vistas de la aplicación.
-->
<script setup>
// No se requieren imports ni lógica especial para el footer
// Es un componente estático con información de la academia
</script>

<template>
  <!-- Pie de página principal -->
  <footer id="footer_ah" class="footer_ah">
    <div class="contenedor_ah">
      <!-- Grid principal del footer con 3 columnas -->
      <div class="footer-grid_ah">
        <!-- Columna 1: Información de la academia -->
        <div class="footer-col_ah">
          <div class="footer-logo_ah">
            <img src="/graduation-cap.png" alt="Academia H&B" class="logo-icono_ah" />
            <span class="logo-texto_ah"
              >Academia <span class="logo-acento_ah">H&B</span></span
            >
          </div>
          <p class="footer-descripcion_ah">
            Tu academia de certificaciones de confianza. Merch oficial para
            estudiantes, egresados e instructores que viven la tecnología.
          </p>
          <!-- Iconos de redes sociales -->
          <div class="footer-redes_ah">
            <a href="#" class="red-social_ah" aria-label="Instagram">📸</a>
            <a href="#" class="red-social_ah" aria-label="Twitter / X">🐦</a>
            <a href="#" class="red-social_ah" aria-label="LinkedIn">💼</a>
            <a href="#" class="red-social_ah" aria-label="YouTube">▶️</a>
          </div>
        </div>

        <!-- Columna 2: Enlaces rápidos -->
        <div class="footer-col_ah">
          <h4 class="footer-titulo_ah">Enlaces Rápidos</h4>
          <ul class="footer-lista_ah">
            <li>
              <router-link to="/" class="footer-enlace_ah">Inicio</router-link>
            </li>
            <li>
              <a href="#beneficios_ah" class="footer-enlace_ah">Beneficios</a>
            </li>
            <li>
              <a href="#faq_ah" class="footer-enlace_ah"
                >Preguntas Frecuentes</a
              >
            </li>
          </ul>
        </div>

        <!-- Columna 3: Contacto -->
        <div class="footer-col_ah">
          <h4 class="footer-titulo_ah">Contacto</h4>
          <ul class="footer-lista_ah">
            <li class="footer-contacto-item_ah">
              <span>📧</span>
              <a
                href="mailto:merch@academiah-b.com"
                class="footer-enlace_ah"
              >
                merch@academiah-b.com
              </a>
            </li>
            <li class="footer-contacto-item_ah">
              <span>📞</span>
              <span class="footer-enlace_ah">+58 (412) 555-0199</span>
            </li>
            <li class="footer-contacto-item_ah">
              <span>📍</span>
              <span class="footer-enlace_ah">Caracas, Venezuela</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Separador visual -->
      <div class="footer-separador_ah"></div>

      <!-- Barra inferior con copyright y enlaces legales -->
      <div class="footer-inferior_ah">
        <p class="footer-copyright_ah">
          &copy; {{ new Date().getFullYear() }} Academia H&B. Todos los
          derechos reservados.
        </p>
        <div class="footer-legal_ah">
          <a href="#" class="footer-enlace-legal_ah">Términos y Condiciones</a>
          <a href="#" class="footer-enlace-legal_ah">Política de Privacidad</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer_ah {
  background: var(--color-fondo-oscuro_ah);
  color: var(--color-texto-blanco_ah);
  padding: var(--espacio-3xl_ah) 0 var(--espacio-xl_ah);
}

.footer-grid_ah {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: var(--espacio-3xl_ah);
}

.footer-logo_ah {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: var(--espacio-md_ah);
}

.footer-logo_ah .logo-icono_ah {
  width: 22px;
  height: 22px;
  object-fit: contain;
  display: block;
}

.footer-logo_ah .logo-texto_ah {
  font-family: var(--fuente-titulo_ah);
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.footer-logo_ah .logo-acento_ah {
  color: var(--color-acento_ah);
}

.footer-descripcion_ah {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: var(--espacio-lg_ah);
}

.footer-redes_ah {
  display: flex;
  gap: var(--espacio-sm_ah);
}

.red-social_ah {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radio-md_ah);
  font-size: 1.1rem;
  transition: all var(--transicion-rapida_ah);
}

.red-social_ah:hover {
  background: var(--color-acento_ah);
  transform: translateY(-2px);
}

.footer-titulo_ah {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--espacio-lg_ah);
  position: relative;
  padding-bottom: var(--espacio-sm_ah);
}

.footer-titulo_ah::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 30px;
  height: 3px;
  background: var(--color-acento_ah);
  border-radius: var(--radio-completo_ah);
}

.footer-lista_ah {
  display: flex;
  flex-direction: column;
  gap: var(--espacio-sm_ah);
}

.footer-enlace_ah {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  transition: color var(--transicion-rapida_ah);
}

.footer-enlace_ah:hover {
  color: var(--color-acento_ah);
}

.footer-contacto-item_ah {
  display: flex;
  align-items: center;
  gap: var(--espacio-sm_ah);
  font-size: 0.9rem;
}

.footer-separador_ah {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: var(--espacio-2xl_ah) 0 var(--espacio-lg_ah);
}

.footer-inferior_ah {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--espacio-md_ah);
}

.footer-copyright_ah {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
}

.footer-legal_ah {
  display: flex;
  gap: var(--espacio-lg_ah);
}

.footer-enlace-legal_ah {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.85rem;
  transition: color var(--transicion-rapida_ah);
}

.footer-enlace-legal_ah:hover {
  color: var(--color-acento_ah);
}

@media (max-width: 768px) {
  .footer-grid_ah {
    grid-template-columns: 1fr;
    gap: var(--espacio-xl_ah);
  }

  .footer-inferior_ah {
    flex-direction: column;
    text-align: center;
  }
}
</style>

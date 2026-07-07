<!-- Barra de navegación principal -->
<script setup>
import { useAutenticacionStore_ahbb } from '../../stores/autenticacionStore_ahbb';
import BadgeCarrito_ahbb from '../tienda/BadgeCarrito_ahbb.vue';

const authStore_ahbb = useAutenticacionStore_ahbb();
</script>

<template>
  <nav id="navbar_ah" class="navbar_ah">
    <div class="contenedor_ah navbar-contenido_ah">
      <router-link to="/" class="navbar-logo_ah">
        <img src="/graduation-cap.png" alt="Academia H&B" class="logo-icono_ah" />
        <span class="logo-texto_ah"
          >Academia <span class="logo-acento_ah">H&B</span></span
        >
      </router-link>

      <div class="navbar-enlaces_ah">
        <router-link
          to="/"
          class="navbar-enlace_ah"
          active-class="enlace-activo_ah"
        >
          Inicio
        </router-link>
        <router-link
          to="/tienda"
          class="navbar-enlace_ah"
          active-class="enlace-activo_ah"
        >
          Nuestros Productos
        </router-link>
        <router-link
          v-if="authStore_ahbb.estaAutenticado_ahbb"
          to="/dashboard"
          class="navbar-enlace_ah"
          active-class="enlace-activo_ah"
        >
          Mi Panel
        </router-link>
        <router-link
          v-else
          to="/login"
          class="navbar-enlace_ah"
          active-class="enlace-activo_ah"
        >
          Iniciar Sesión
        </router-link>

        <q-btn v-if="authStore_ahbb.estaAutenticado_ahbb" flat round color="white" icon="logout" @click="authStore_ahbb.cerrarSesion_ahbb(); $router.push('/')">
          <q-tooltip>Cerrar Sesión</q-tooltip>
        </q-btn>

        <div v-if="authStore_ahbb.estaAutenticado_ahbb" class="q-ml-sm row items-center">
          <BadgeCarrito_ahbb />
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar_ah {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(27, 42, 74, 0.95);
  backdrop-filter: blur(12px);
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
}

.navbar-contenido_ah {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.navbar-logo_ah {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: transform var(--transicion-rapida_ah);
}

.navbar-logo_ah:hover {
  transform: scale(1.02);
}

.logo-icono_ah {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}

.logo-texto_ah {
  font-family: var(--fuente-titulo_ah);
  font-size: 1.35rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.02em;
}

.logo-acento_ah {
  color: var(--color-acento_ah);
}

.navbar-enlaces_ah {
  display: flex;
  gap: var(--espacio-xl_ah);
  align-items: center;
}

.navbar-enlace_ah {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.5rem 0;
  position: relative;
  transition: color var(--transicion-rapida_ah);
}

.navbar-enlace_ah:hover {
  color: white;
}

.navbar-enlace_ah::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-acento_ah);
  transition: width var(--transicion-media_ah);
}

.navbar-enlace_ah:hover::after,
.enlace-activo_ah::after {
  width: 100%;
}

.enlace-activo_ah {
  color: white;
}

.navbar-carrito_ah {
  position: relative;
  color: white;
  padding: 0.5rem;
  transition: all var(--transicion-rapida_ah);
  border-radius: var(--radio-md_ah);
}

.navbar-carrito_ah:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-acento_ah);
}

.carrito-badge_ah {
  position: absolute;
  top: -4px;
  right: -4px;
  animation: pulso_ah 0.3s ease;
}

@media (max-width: 768px) {
  .navbar-contenido_ah {
    height: 60px;
  }

  .logo-texto_ah {
    font-size: 1.1rem;
  }

  .navbar-enlaces_ah {
    gap: var(--espacio-md_ah);
  }

  .navbar-enlace_ah {
    font-size: 0.85rem;
  }
}
</style>

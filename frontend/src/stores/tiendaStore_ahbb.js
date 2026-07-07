/**
 * tiendaStore_ahbb.js — Store Pinia para el módulo de tienda
 */
import { defineStore } from 'pinia';
import {
  obtenerProductos_ahbb,
  obtenerCarrito_ahbb as servicioObtenerCarrito_ahbb,
  agregarAlCarrito_ahbb as servicioAgregarAlCarrito_ahbb,
  actualizarCantidadCarrito_ahbb as servicioActualizarCantidadCarrito_ahbb,
  eliminarItemCarrito_ahbb as servicioEliminarItemCarrito_ahbb,
  vaciarCarrito_ahbb as servicioVaciarCarrito_ahbb,
  crearFactura_ahbb as servicioCrearFactura_ahbb,
  obtenerHistorialFacturas_ahbb as servicioObtenerHistorialFacturas_ahbb,
  obtenerIdsFavoritos_ahbb as servicioObtenerIdsFavoritos_ahbb,
  toggleFavorito_ahbb as servicioToggleFavorito_ahbb,
  obtenerFavoritos_ahbb as servicioObtenerFavoritos_ahbb,
} from '../servicios/tiendaServicio_ahbb';

export const useTiendaStore_ahbb = defineStore('tienda_ahbb', {
  state: () => ({
    // Productos
    listaProductos_ahbb: [],
    terminoBusqueda_ahbb: '',
    filtroCategoria_ahbb: 'todas',
    cargando_ahbb: false,

    // Carrito
    itemsCarrito_ahbb: [],
    cargandoCarrito_ahbb: false,

    // Favoritos
    idsFavoritos_ahbb: [],
    listaFavoritos_ahbb: [],

    // Facturas
    historialFacturas_ahbb: [],
  }),

  getters: {
    productosFiltrados_ahbb: (estado) => {
      let resultado_ahbb = [...estado.listaProductos_ahbb];

      if (estado.filtroCategoria_ahbb !== 'todas') {
        resultado_ahbb = resultado_ahbb.filter(
          (p) => p.categoria_ahbb === estado.filtroCategoria_ahbb,
        );
      }

      if (estado.terminoBusqueda_ahbb.trim() !== '') {
        const termino_ahbb = estado.terminoBusqueda_ahbb.toLowerCase().trim();
        resultado_ahbb = resultado_ahbb.filter(
          (p) =>
            p.nombre_ahbb.toLowerCase().includes(termino_ahbb) ||
            (p.descripcion_ahbb || '').toLowerCase().includes(termino_ahbb),
        );
      }

      return resultado_ahbb;
    },

    totalItemsCarrito_ahbb: (estado) =>
      estado.itemsCarrito_ahbb.reduce((acc, item) => acc + item.cantidad_ahbb, 0),

    totalPrecioCarrito_ahbb: (estado) =>
      estado.itemsCarrito_ahbb.reduce(
        (acc, item) => acc + Number(item.producto_ahbb?.precio_ahbb || 0) * item.cantidad_ahbb,
        0,
      ),

    esFavorito_ahbb: (estado) => (idProducto) =>
      estado.idsFavoritos_ahbb.includes(idProducto),

    categoriasDisponibles_ahbb: (estado) => {
      const cats = [...new Set(estado.listaProductos_ahbb.map((p) => p.categoria_ahbb))];
      return ['todas', ...cats];
    },
  },

  actions: {
    // ─── PRODUCTOS ──────────────────────────────────
    async cargarProductos_ahbb(params = {}) {
      this.cargando_ahbb = true;
      try {
        const resp = await obtenerProductos_ahbb(params);
        this.listaProductos_ahbb = resp.data;
      } finally {
        this.cargando_ahbb = false;
      }
    },

    buscar_ahbb(termino) {
      this.terminoBusqueda_ahbb = termino;
    },

    filtrarPorCategoria_ahbb(categoria) {
      this.filtroCategoria_ahbb = categoria;
    },

    // ─── CARRITO ────────────────────────────────────
    async cargarCarrito_ahbb() {
      this.cargandoCarrito_ahbb = true;
      try {
        const resp = await servicioObtenerCarrito_ahbb();
        this.itemsCarrito_ahbb = resp.data;
      } catch {
        // Si no está logueado, ignorar
        this.itemsCarrito_ahbb = [];
      } finally {
        this.cargandoCarrito_ahbb = false;
      }
    },

    async agregarAlCarrito_ahbb(idProducto, cantidad = 1) {
      const resp = await servicioAgregarAlCarrito_ahbb(idProducto, cantidad);
      await this.cargarCarrito_ahbb();
      return resp.data;
    },

    async actualizarCantidad_ahbb(idCarrito, cantidad) {
      await servicioActualizarCantidadCarrito_ahbb(idCarrito, cantidad);
      await this.cargarCarrito_ahbb();
    },

    async eliminarItem_ahbb(idCarrito) {
      await servicioEliminarItemCarrito_ahbb(idCarrito);
      await this.cargarCarrito_ahbb();
    },

    async vaciarCarrito_ahbb() {
      await servicioVaciarCarrito_ahbb();
      this.itemsCarrito_ahbb = [];
    },

    // ─── CHECKOUT ───────────────────────────────────
    async checkout_ahbb(nroReferenciaPago) {
      const resp = await servicioCrearFactura_ahbb(nroReferenciaPago);
      this.itemsCarrito_ahbb = [];
      return resp.data;
    },

    // ─── FACTURAS ───────────────────────────────────
    async cargarHistorial_ahbb() {
      const resp = await servicioObtenerHistorialFacturas_ahbb();
      this.historialFacturas_ahbb = resp.data;
    },

    // ─── FAVORITOS ──────────────────────────────────
    async cargarIdsFavoritos_ahbb() {
      try {
        const resp = await servicioObtenerIdsFavoritos_ahbb();
        this.idsFavoritos_ahbb = resp.data;
      } catch {
        this.idsFavoritos_ahbb = [];
      }
    },

    async cargarFavoritos_ahbb() {
      const resp = await servicioObtenerFavoritos_ahbb();
      this.listaFavoritos_ahbb = resp.data;
    },

    async toggleFavorito_ahbb(idProducto) {
      const resp = await servicioToggleFavorito_ahbb(idProducto);
      if (resp.data.esFavorito) {
        this.idsFavoritos_ahbb.push(idProducto);
      } else {
        this.idsFavoritos_ahbb = this.idsFavoritos_ahbb.filter((id) => id !== idProducto);
      }
      return resp.data;
    },
  },
});

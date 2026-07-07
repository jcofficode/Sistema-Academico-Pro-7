/**
 * tiendaServicio_ahbb.js — Capa de comunicación HTTP con la API de tienda
 */
import { apiCliente_ahbb } from './api_ahbb';

// ─── PRODUCTOS ──────────────────────────────────────
export const obtenerProductos_ahbb = (params = {}) =>
  apiCliente_ahbb.get('/productos', { params });

export const obtenerProductoPorId_ahbb = (id) =>
  apiCliente_ahbb.get(`/productos/${id}`);

export const crearProducto_ahbb = (datos) =>
  apiCliente_ahbb.post('/productos', datos);

export const actualizarProducto_ahbb = (id, datos) =>
  apiCliente_ahbb.patch(`/productos/${id}`, datos);

export const eliminarProducto_ahbb = (id) =>
  apiCliente_ahbb.delete(`/productos/${id}`);

// ─── CARRITO ────────────────────────────────────────
export const obtenerCarrito_ahbb = () =>
  apiCliente_ahbb.get('/carrito');

export const agregarAlCarrito_ahbb = (idProducto, cantidad = 1) =>
  apiCliente_ahbb.post('/carrito', { idProducto, cantidad });

export const actualizarCantidadCarrito_ahbb = (idCarrito, cantidad) =>
  apiCliente_ahbb.patch(`/carrito/${idCarrito}`, { cantidad });

export const eliminarItemCarrito_ahbb = (idCarrito) =>
  apiCliente_ahbb.delete(`/carrito/${idCarrito}`);

export const vaciarCarrito_ahbb = () =>
  apiCliente_ahbb.delete('/carrito');

// ─── FACTURAS ───────────────────────────────────────
export const crearFactura_ahbb = (nroReferenciaPago) =>
  apiCliente_ahbb.post('/facturas', { nroReferenciaPago });

export const obtenerHistorialFacturas_ahbb = () =>
  apiCliente_ahbb.get('/facturas');

export const obtenerFacturaPorId_ahbb = (id) =>
  apiCliente_ahbb.get(`/facturas/${id}`);

export const obtenerPdfFactura_ahbb = (id) =>
  apiCliente_ahbb.get(`/facturas/${id}/pdf`, { responseType: 'blob' });

export const obtenerTodasFacturas_ahbb = () =>
  apiCliente_ahbb.get('/facturas/admin/todas');

export const cambiarEstadoFactura_ahbb = (id, estado) =>
  apiCliente_ahbb.patch(`/facturas/${id}/estado`, { estado });

// ─── FAVORITOS ──────────────────────────────────────
export const obtenerFavoritos_ahbb = () =>
  apiCliente_ahbb.get('/favoritos');

export const obtenerIdsFavoritos_ahbb = () =>
  apiCliente_ahbb.get('/favoritos/ids');

export const toggleFavorito_ahbb = (idProducto) =>
  apiCliente_ahbb.post(`/favoritos/${idProducto}`);

export const eliminarFavorito_ahbb = (idProducto) =>
  apiCliente_ahbb.delete(`/favoritos/${idProducto}`);

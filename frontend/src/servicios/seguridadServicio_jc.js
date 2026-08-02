/**
 * seguridadServicio_jc.js — Capa Axios de los subsistemas transversales
 * aportados por el módulo de Control de Estudios:
 *
 *  · RBAC      → consola de Roles y Accesos del administrador.
 *  · Auditoría → bitácora general del sistema.
 */
import { apiCliente_ahbb } from './api_ahbb';

/** Aplana los errores del backend para que la vista muestre texto legible. */
const extraerError_jc = (error_jc, mensajePorDefecto_jc) => {
  const cuerpo_jc = error_jc.response?.data;
  const anidado_jc =
    typeof cuerpo_jc?.mensaje === 'object' && cuerpo_jc?.mensaje !== null
      ? cuerpo_jc.mensaje
      : cuerpo_jc;

  return {
    mensaje:
      (typeof anidado_jc?.mensaje === 'string' && anidado_jc.mensaje) ||
      (typeof cuerpo_jc?.mensaje === 'string' && cuerpo_jc.mensaje) ||
      anidado_jc?.message ||
      mensajePorDefecto_jc,
    errores: anidado_jc?.errores ?? [],
  };
};

// ─── RBAC: Roles y Accesos ────────────────────────────────────

/** Catálogo de roles y matriz de permisos del sistema. */
export const obtenerCatalogoRoles_jc = async () => {
  const respuesta_jc = await apiCliente_ahbb.get('/rbac/roles');
  return respuesta_jc.data;
};

export const listarUsuariosRbac_jc = async (filtros_jc = {}) => {
  const respuesta_jc = await apiCliente_ahbb.get('/rbac/usuarios', {
    params: filtros_jc,
  });
  return respuesta_jc.data;
};

export const crearUsuarioRbac_jc = async (datos_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.post('/rbac/usuarios', datos_jc);
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      ...extraerError_jc(error_jc, 'No se pudo crear el usuario.'),
    };
  }
};

export const asignarRol_jc = async (idUsuario_jc, rol_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.patch(
      `/rbac/usuarios/${idUsuario_jc}/rol`,
      { rol_jc },
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      ...extraerError_jc(error_jc, 'No se pudo cambiar el rol.'),
    };
  }
};

export const restablecerContrasena_jc = async (idUsuario_jc, datos_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.patch(
      `/rbac/usuarios/${idUsuario_jc}/contrasena`,
      datos_jc,
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      ...extraerError_jc(error_jc, 'No se pudo restablecer la contraseña.'),
    };
  }
};

export const cambiarEstadoCuenta_jc = async (idUsuario_jc, estadoCuenta_jc) => {
  try {
    const respuesta_jc = await apiCliente_ahbb.patch(
      `/rbac/usuarios/${idUsuario_jc}/estado`,
      { estadoCuenta_jc },
    );
    return respuesta_jc.data;
  } catch (error_jc) {
    return {
      exito: false,
      ...extraerError_jc(error_jc, 'No se pudo cambiar el estado de la cuenta.'),
    };
  }
};

// ─── Auditoría general del sistema ────────────────────────────

export const consultarAuditoria_jc = async (filtros_jc = {}) => {
  const respuesta_jc = await apiCliente_ahbb.get('/auditoria', {
    params: filtros_jc,
  });
  return respuesta_jc.data;
};

export const obtenerResumenAuditoria_jc = async (modulo_jc) => {
  const respuesta_jc = await apiCliente_ahbb.get('/auditoria/resumen', {
    params: modulo_jc ? { modulo_jc } : {},
  });
  return respuesta_jc.data;
};

export const obtenerCatalogosAuditoria_jc = async () => {
  const respuesta_jc = await apiCliente_ahbb.get('/auditoria/catalogos');
  return respuesta_jc.data;
};

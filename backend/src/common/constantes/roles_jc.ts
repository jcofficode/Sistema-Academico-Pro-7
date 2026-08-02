/**
 * roles_jc.ts — Catálogo único de roles del sistema.
 *
 * Antes cada archivo repetía las cadenas 'ADMIN', 'PROFESOR'… Al incorporar el
 * rol CONTROL_ESTUDIOS se centralizó aquí para que exista una sola fuente de
 * verdad: los guards, el RBAC del administrador y la normalización de roles
 * consumen estas constantes.
 *
 * Convención heredada del sistema:
 *   - En la base de datos y en el JWT los roles van en MAYÚSCULAS.
 *   - El frontend los maneja en minúsculas (ver frontend/src/constantes/roles_ahbb.js).
 */

/** Roles internos (valor almacenado en td_usuario_ahbb.rol_ahbb). */
export const ROLES_JC = {
  ADMIN: 'ADMIN',
  CONTROL_ESTUDIOS: 'CONTROL_ESTUDIOS',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

export type RolInterno_jc = (typeof ROLES_JC)[keyof typeof ROLES_JC];

/**
 * Roles que pueden operar Control de Estudios (cargar notas, emitir y cerrar
 * actas). El administrador queda deliberadamente fuera: solo consulta.
 */
export const ROLES_OPERADORES_NOTAS_JC: RolInterno_jc[] = [
  ROLES_JC.PROFESOR,
  ROLES_JC.CONTROL_ESTUDIOS,
];

/** Roles que pueden CONSULTAR la información académica sin modificarla. */
export const ROLES_CONSULTA_NOTAS_JC: RolInterno_jc[] = [
  ROLES_JC.ADMIN,
  ROLES_JC.CONTROL_ESTUDIOS,
  ROLES_JC.PROFESOR,
];

/** Catálogo legible para la pantalla de RBAC del administrador. */
export const CATALOGO_ROLES_JC = [
  {
    valor: ROLES_JC.ADMIN,
    etiqueta: 'Administrador',
    etiquetaFrontend: 'administrador',
    descripcion:
      'Configura el sistema y supervisa. En Control de Estudios solo consulta: no carga notas ni emite actas.',
    color: 'deep-purple',
    icono: 'admin_panel_settings',
  },
  {
    valor: ROLES_JC.CONTROL_ESTUDIOS,
    etiqueta: 'Control de Estudios',
    etiquetaFrontend: 'control_estudios',
    descripcion:
      'Personal de Control de Estudios: carga y corrige notas de cualquier materia, registra reparaciones, emite y cierra actas, y audita la actividad académica.',
    color: 'teal',
    icono: 'fact_check',
  },
  {
    valor: ROLES_JC.PROFESOR,
    etiqueta: 'Profesor',
    etiquetaFrontend: 'profesor',
    descripcion:
      'Docente: carga las notas de las materias que tiene asignadas, registra reparaciones y emite sus actas.',
    color: 'primary',
    icono: 'co_present',
  },
  {
    valor: ROLES_JC.ALUMNO,
    etiqueta: 'Alumno',
    etiquetaFrontend: 'alumno',
    descripcion:
      'Estudiante: consulta sus notas, sus certificados y su expediente académico.',
    color: 'orange',
    icono: 'school',
  },
];

/**
 * Matriz de permisos que se muestra en la pantalla de RBAC.
 * Es documentación viva: refleja lo que realmente aplican los guards.
 */
export const MATRIZ_PERMISOS_JC = [
  {
    modulo: 'Control de Estudios',
    permisos: [
      { accion: 'Definir y publicar planes de evaluación', roles: [ROLES_JC.ADMIN] },
      { accion: 'Cargar y corregir notas', roles: ROLES_OPERADORES_NOTAS_JC },
      { accion: 'Registrar reparaciones por corte', roles: ROLES_OPERADORES_NOTAS_JC },
      { accion: 'Emitir actas en PDF', roles: ROLES_OPERADORES_NOTAS_JC },
      { accion: 'Cerrar actas definitivas', roles: ROLES_OPERADORES_NOTAS_JC },
      {
        accion: 'Consultar notas por carrera y materia',
        roles: [ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS],
      },
      {
        accion: 'Auditoría académica de Control de Estudios',
        roles: [ROLES_JC.ADMIN, ROLES_JC.CONTROL_ESTUDIOS],
      },
      { accion: 'Carga masiva de calificaciones (CSV)', roles: [ROLES_JC.CONTROL_ESTUDIOS] },
    ],
  },
  {
    modulo: 'Administración',
    permisos: [
      { accion: 'Crear usuarios y asignar roles (RBAC)', roles: [ROLES_JC.ADMIN] },
      { accion: 'Auditoría general del sistema', roles: [ROLES_JC.ADMIN] },
      { accion: 'Gestionar carreras, pensums y períodos', roles: [ROLES_JC.ADMIN] },
    ],
  },
  {
    modulo: 'Alumno',
    permisos: [
      { accion: 'Consultar sus propias notas', roles: [ROLES_JC.ALUMNO] },
      { accion: 'Descargar su certificado de sobresaliente', roles: [ROLES_JC.ALUMNO] },
    ],
  },
];

/** Normaliza cualquier variante recibida del cliente al valor interno. */
export const normalizarRol_jc = (rol_jc?: string | null): RolInterno_jc => {
  const normalizado_jc = String(rol_jc ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (normalizado_jc === 'administrador' || normalizado_jc === 'admin') {
    return ROLES_JC.ADMIN;
  }
  if (
    normalizado_jc === 'control_estudios' ||
    normalizado_jc === 'controlestudios' ||
    normalizado_jc === 'control_de_estudios'
  ) {
    return ROLES_JC.CONTROL_ESTUDIOS;
  }
  if (normalizado_jc === 'profesor') {
    return ROLES_JC.PROFESOR;
  }
  return ROLES_JC.ALUMNO;
};

/** Traduce el rol interno al valor que consume el frontend. */
export const rolParaFrontend_jc = (rol_jc?: string | null): string =>
  CATALOGO_ROLES_JC.find((entrada_jc) => entrada_jc.valor === rol_jc)
    ?.etiquetaFrontend ?? 'alumno';

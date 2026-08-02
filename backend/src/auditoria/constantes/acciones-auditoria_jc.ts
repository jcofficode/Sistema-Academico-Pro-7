/**
 * acciones-auditoria_jc.ts — Catálogo de acciones auditables.
 *
 * El sistema audita por dos vías complementarias:
 *
 *  1. **Automática (interceptor):** toda petición que modifica datos queda
 *     registrada aunque nadie haya instrumentado ese endpoint. El catálogo de
 *     abajo traduce «POST /auth/cambiar-contrasena» a una frase legible.
 *
 *  2. **Enriquecida (servicios de negocio):** cuando hace falta contexto que la
 *     petición HTTP no conoce (a qué alumno, en qué materia, con qué nota), el
 *     propio servicio llama a `AuditoriaService_jc.registrar_jc()`. Esas rutas
 *     se marcan con `delegado: true` para que el interceptor no las duplique.
 */

/** Módulos a los que se puede atribuir una acción. */
export const MODULOS_AUDITORIA_JC = {
  CONTROL_ESTUDIOS: 'CONTROL_ESTUDIOS',
  SEGURIDAD: 'SEGURIDAD',
  USUARIOS: 'USUARIOS',
  ACADEMICO: 'ACADEMICO',
  PAGOS: 'PAGOS',
  PLANIFICACION: 'PLANIFICACION',
  MULTIMEDIA: 'MULTIMEDIA',
  SISTEMA: 'SISTEMA',
} as const;

/** Códigos estables de acción (se guardan en la bitácora y se filtran por ellos). */
export const ACCIONES_JC = {
  // Control de Estudios
  NOTAS_CARGADAS: 'NOTAS_CARGADAS',
  REPARACION_REGISTRADA: 'REPARACION_REGISTRADA',
  REPARACION_ELIMINADA: 'REPARACION_ELIMINADA',
  ACTA_EMITIDA: 'ACTA_EMITIDA',
  ACTA_CERRADA: 'ACTA_CERRADA',
  CERTIFICADO_SOBRESALIENTE: 'CERTIFICADO_SOBRESALIENTE',
  PLAN_CREADO: 'PLAN_CREADO',
  PLAN_ACTUALIZADO: 'PLAN_ACTUALIZADO',
  PLAN_PUBLICADO: 'PLAN_PUBLICADO',
  PLAN_ELIMINADO: 'PLAN_ELIMINADO',
  CSV_VALIDADO: 'CSV_VALIDADO',
  CSV_CONFIRMADO: 'CSV_CONFIRMADO',
  // Seguridad y usuarios
  SESION_INICIADA: 'SESION_INICIADA',
  SESION_CERRADA: 'SESION_CERRADA',
  CONTRASENA_CAMBIADA: 'CONTRASENA_CAMBIADA',
  CONTRASENA_RESTABLECIDA: 'CONTRASENA_RESTABLECIDA',
  USUARIO_CREADO: 'USUARIO_CREADO',
  USUARIO_ACTUALIZADO: 'USUARIO_ACTUALIZADO',
  USUARIO_ESTADO_CAMBIADO: 'USUARIO_ESTADO_CAMBIADO',
  ROL_ASIGNADO: 'ROL_ASIGNADO',
  // Otros módulos
  CARRERA_CREADA: 'CARRERA_CREADA',
  CARRERA_ELIMINADA: 'CARRERA_ELIMINADA',
  PROFESOR_ASIGNADO: 'PROFESOR_ASIGNADO',
  PERIODO_ACTIVADO: 'PERIODO_ACTIVADO',
  MATERIAS_INSCRITAS: 'MATERIAS_INSCRITAS',
  MATERIA_RETIRADA: 'MATERIA_RETIRADA',
  PAGO_REGISTRADO: 'PAGO_REGISTRADO',
  PAGO_CONFIRMADO: 'PAGO_CONFIRMADO',
  NOMINA_GENERADA: 'NOMINA_GENERADA',
  PLAN_ESTUDIO_ENTREGADO: 'PLAN_ESTUDIO_ENTREGADO',
  PLAN_ESTUDIO_REVISADO: 'PLAN_ESTUDIO_REVISADO',
  OPERACION_GENERICA: 'OPERACION_GENERICA',
} as const;

export interface ReglaAuditoria_jc {
  /** Método HTTP; `*` aplica a cualquiera. */
  metodo: string;
  /** Expresión que debe casar con la ruta (sin el prefijo /api). */
  patron: RegExp;
  modulo: string;
  accion: string;
  /** Frase en tercera persona; se antepone el nombre del usuario. */
  descripcion: string;
  /** true = el servicio de negocio ya lo registra con más detalle. */
  delegado?: boolean;
}

/**
 * Reglas evaluadas en orden: gana la primera que case.
 * Las más específicas van primero.
 */
export const REGLAS_AUDITORIA_JC: ReglaAuditoria_jc[] = [
  // ── Control de Estudios (el detalle académico lo aporta el servicio) ──
  {
    metodo: 'POST',
    patron: /^\/control-estudios\/calificaciones\/cerrar-acta/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.ACTA_CERRADA,
    descripcion: 'cerró un acta definitiva',
    delegado: true,
  },
  {
    metodo: 'POST',
    patron: /^\/control-estudios\/calificaciones$/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.NOTAS_CARGADAS,
    descripcion: 'cargó notas',
    delegado: true,
  },
  {
    metodo: 'POST',
    patron: /^\/control-estudios\/reparaciones/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.REPARACION_REGISTRADA,
    descripcion: 'registró una reparación',
    delegado: true,
  },
  {
    metodo: 'DELETE',
    patron: /^\/control-estudios\/reparaciones/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.REPARACION_ELIMINADA,
    descripcion: 'eliminó una reparación',
    delegado: true,
  },
  {
    metodo: 'PATCH',
    patron: /^\/control-estudios\/planes-evaluacion\/\d+\/publicar/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.PLAN_PUBLICADO,
    descripcion: 'publicó un plan de evaluación',
  },
  {
    metodo: 'POST',
    patron: /^\/control-estudios\/planes-evaluacion$/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.PLAN_CREADO,
    descripcion: 'creó un plan de evaluación',
  },
  {
    metodo: 'PUT',
    patron: /^\/control-estudios\/planes-evaluacion\/\d+/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.PLAN_ACTUALIZADO,
    descripcion: 'modificó un plan de evaluación',
  },
  {
    metodo: 'DELETE',
    patron: /^\/control-estudios\/planes-evaluacion\/\d+/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.PLAN_ELIMINADO,
    descripcion: 'eliminó un plan de evaluación',
  },
  {
    metodo: 'POST',
    patron: /^\/control-estudios\/csv\/[\w-]+\/validar/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.CSV_VALIDADO,
    descripcion: 'validó un archivo CSV de carga masiva',
  },
  {
    metodo: 'POST',
    patron: /^\/control-estudios\/csv\/[\w-]+\/confirmar/,
    modulo: MODULOS_AUDITORIA_JC.CONTROL_ESTUDIOS,
    accion: ACCIONES_JC.CSV_CONFIRMADO,
    descripcion: 'confirmó una carga masiva por CSV',
  },

  // ── Seguridad ──
  {
    metodo: 'POST',
    patron: /^\/auth\/iniciar-sesion/,
    modulo: MODULOS_AUDITORIA_JC.SEGURIDAD,
    accion: ACCIONES_JC.SESION_INICIADA,
    descripcion: 'inició sesión',
  },
  {
    metodo: 'POST',
    patron: /^\/auth\/cerrar-sesion/,
    modulo: MODULOS_AUDITORIA_JC.SEGURIDAD,
    accion: ACCIONES_JC.SESION_CERRADA,
    descripcion: 'cerró sesión',
  },
  {
    metodo: 'POST',
    patron: /^\/auth\/cambiar-contrasena/,
    modulo: MODULOS_AUDITORIA_JC.SEGURIDAD,
    accion: ACCIONES_JC.CONTRASENA_CAMBIADA,
    descripcion: 'cambió su contraseña',
  },
  {
    metodo: 'POST',
    patron: /^\/auth\/registrar/,
    modulo: MODULOS_AUDITORIA_JC.USUARIOS,
    accion: ACCIONES_JC.USUARIO_CREADO,
    descripcion: 'registró una cuenta nueva',
  },

  // ── RBAC (el servicio añade a quién afecta) ──
  {
    metodo: 'POST',
    patron: /^\/rbac\/usuarios$/,
    modulo: MODULOS_AUDITORIA_JC.USUARIOS,
    accion: ACCIONES_JC.USUARIO_CREADO,
    descripcion: 'creó un usuario',
    delegado: true,
  },
  {
    metodo: 'PATCH',
    patron: /^\/rbac\/usuarios\/\d+\/rol/,
    modulo: MODULOS_AUDITORIA_JC.USUARIOS,
    accion: ACCIONES_JC.ROL_ASIGNADO,
    descripcion: 'cambió el rol de un usuario',
    delegado: true,
  },
  {
    metodo: 'PATCH',
    patron: /^\/rbac\/usuarios\/\d+\/contrasena/,
    modulo: MODULOS_AUDITORIA_JC.SEGURIDAD,
    accion: ACCIONES_JC.CONTRASENA_RESTABLECIDA,
    descripcion: 'restableció la contraseña de un usuario',
    delegado: true,
  },
  {
    metodo: 'PATCH',
    patron: /^\/rbac\/usuarios\/\d+\/estado/,
    modulo: MODULOS_AUDITORIA_JC.USUARIOS,
    accion: ACCIONES_JC.USUARIO_ESTADO_CAMBIADO,
    descripcion: 'cambió el estado de una cuenta',
    delegado: true,
  },

  // ── Usuarios (rutas heredadas) ──
  {
    metodo: 'PATCH',
    patron: /^\/usuarios\/\d+\/estado/,
    modulo: MODULOS_AUDITORIA_JC.USUARIOS,
    accion: ACCIONES_JC.USUARIO_ESTADO_CAMBIADO,
    descripcion: 'cambió el estado de una cuenta',
  },
  {
    metodo: '*',
    patron: /^\/usuarios/,
    modulo: MODULOS_AUDITORIA_JC.USUARIOS,
    accion: ACCIONES_JC.USUARIO_ACTUALIZADO,
    descripcion: 'actualizó datos de usuario',
  },

  // ── Módulo académico (_cjgp) ──
  {
    metodo: 'PATCH',
    patron: /^\/academico\/carreras\/materias\/\d+\/profesor/,
    modulo: MODULOS_AUDITORIA_JC.ACADEMICO,
    accion: ACCIONES_JC.PROFESOR_ASIGNADO,
    descripcion: 'asignó el profesor de una materia',
  },
  {
    metodo: 'POST',
    patron: /^\/academico\/carreras$/,
    modulo: MODULOS_AUDITORIA_JC.ACADEMICO,
    accion: ACCIONES_JC.CARRERA_CREADA,
    descripcion: 'creó una carrera con su pensum',
  },
  {
    metodo: 'DELETE',
    patron: /^\/academico\/carreras\/\d+/,
    modulo: MODULOS_AUDITORIA_JC.ACADEMICO,
    accion: ACCIONES_JC.CARRERA_ELIMINADA,
    descripcion: 'eliminó una carrera',
  },
  {
    metodo: 'PATCH',
    patron: /^\/academico\/periodos\/\d+\/activar/,
    modulo: MODULOS_AUDITORIA_JC.ACADEMICO,
    accion: ACCIONES_JC.PERIODO_ACTIVADO,
    descripcion: 'activó un período académico',
  },
  {
    metodo: 'POST',
    patron: /^\/academico\/inscripcion-materias/,
    modulo: MODULOS_AUDITORIA_JC.ACADEMICO,
    accion: ACCIONES_JC.MATERIAS_INSCRITAS,
    descripcion: 'inscribió materias',
  },
  {
    metodo: 'DELETE',
    patron: /^\/academico\/inscripcion-materias/,
    modulo: MODULOS_AUDITORIA_JC.ACADEMICO,
    accion: ACCIONES_JC.MATERIA_RETIRADA,
    descripcion: 'retiró una materia',
  },

  // ── Pagos (_ap) ──
  {
    metodo: 'PATCH',
    patron: /^\/pagos\/admin\/\d+\/confirmar/,
    modulo: MODULOS_AUDITORIA_JC.PAGOS,
    accion: ACCIONES_JC.PAGO_CONFIRMADO,
    descripcion: 'confirmó o rechazó un pago',
  },
  {
    metodo: 'POST',
    patron: /^\/pagos\/nomina\/generar/,
    modulo: MODULOS_AUDITORIA_JC.PAGOS,
    accion: ACCIONES_JC.NOMINA_GENERADA,
    descripcion: 'generó la nómina de un período',
  },
  {
    metodo: 'POST',
    patron: /^\/pagos$/,
    modulo: MODULOS_AUDITORIA_JC.PAGOS,
    accion: ACCIONES_JC.PAGO_REGISTRADO,
    descripcion: 'registró un pago',
  },

  // ── Planificación (_ga) ──
  {
    metodo: 'PATCH',
    patron: /^\/v1\/plan-estudio\/\d+\/entregar/,
    modulo: MODULOS_AUDITORIA_JC.PLANIFICACION,
    accion: ACCIONES_JC.PLAN_ESTUDIO_ENTREGADO,
    descripcion: 'entregó su plan de estudio a coordinación',
  },
  {
    metodo: 'PATCH',
    patron: /^\/v1\/plan-estudio\/\d+\/revisar/,
    modulo: MODULOS_AUDITORIA_JC.PLANIFICACION,
    accion: ACCIONES_JC.PLAN_ESTUDIO_REVISADO,
    descripcion: 'revisó un plan de estudio',
  },
];

/** Busca la regla que corresponde a una petición. */
export const resolverRegla_jc = (
  metodo_jc: string,
  ruta_jc: string,
): ReglaAuditoria_jc | undefined =>
  REGLAS_AUDITORIA_JC.find(
    (regla_jc) =>
      (regla_jc.metodo === '*' || regla_jc.metodo === metodo_jc) &&
      regla_jc.patron.test(ruta_jc),
  );

/** Etiquetas legibles para los filtros del frontend. */
export const ETIQUETAS_ACCION_JC: Record<string, string> = {
  NOTAS_CARGADAS: 'Carga de notas',
  REPARACION_REGISTRADA: 'Reparación registrada',
  REPARACION_ELIMINADA: 'Reparación eliminada',
  ACTA_EMITIDA: 'Acta emitida',
  ACTA_CERRADA: 'Acta cerrada',
  CERTIFICADO_SOBRESALIENTE: 'Certificado de sobresaliente',
  PLAN_CREADO: 'Plan creado',
  PLAN_ACTUALIZADO: 'Plan modificado',
  PLAN_PUBLICADO: 'Plan publicado',
  PLAN_ELIMINADO: 'Plan eliminado',
  CSV_VALIDADO: 'CSV validado',
  CSV_CONFIRMADO: 'CSV confirmado',
  SESION_INICIADA: 'Inicio de sesión',
  SESION_CERRADA: 'Cierre de sesión',
  CONTRASENA_CAMBIADA: 'Cambio de contraseña',
  CONTRASENA_RESTABLECIDA: 'Contraseña restablecida',
  USUARIO_CREADO: 'Usuario creado',
  USUARIO_ACTUALIZADO: 'Usuario actualizado',
  USUARIO_ESTADO_CAMBIADO: 'Estado de cuenta cambiado',
  ROL_ASIGNADO: 'Rol asignado',
  CARRERA_CREADA: 'Carrera creada',
  CARRERA_ELIMINADA: 'Carrera eliminada',
  PROFESOR_ASIGNADO: 'Profesor asignado',
  PERIODO_ACTIVADO: 'Período activado',
  MATERIAS_INSCRITAS: 'Materias inscritas',
  MATERIA_RETIRADA: 'Materia retirada',
  PAGO_REGISTRADO: 'Pago registrado',
  PAGO_CONFIRMADO: 'Pago confirmado',
  NOMINA_GENERADA: 'Nómina generada',
  PLAN_ESTUDIO_ENTREGADO: 'Plan de estudio entregado',
  PLAN_ESTUDIO_REVISADO: 'Plan de estudio revisado',
  OPERACION_GENERICA: 'Otra operación',
};

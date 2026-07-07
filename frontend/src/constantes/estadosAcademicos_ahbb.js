/**
 * estadosAcademicos_ahbb.js — Constantes para estados académicos de inscripciones
 */

export const ESTADOS_ACADEMICOS_AHBB = {
  INSCRITO: 'inscrito',
  AUN_NO_EMPIEZA: 'aun_no_empieza',
  OYENTE: 'oyente',
  APROBADO: 'aprobado',
  REPROBADO: 'reprobado',
};

export const LISTA_ESTADOS_ACADEMICOS_AHBB = [
  { valor: ESTADOS_ACADEMICOS_AHBB.INSCRITO, etiqueta: 'Inscrito', color: 'blue' },
  { valor: ESTADOS_ACADEMICOS_AHBB.AUN_NO_EMPIEZA, etiqueta: 'Aún no empieza', color: 'grey' },
  { valor: ESTADOS_ACADEMICOS_AHBB.OYENTE, etiqueta: 'Oyente', color: 'purple' },
  { valor: ESTADOS_ACADEMICOS_AHBB.APROBADO, etiqueta: 'Aprobado', color: 'green' },
  { valor: ESTADOS_ACADEMICOS_AHBB.REPROBADO, etiqueta: 'Reprobado', color: 'red' },
];

/** Estados del ciclo de vida de un curso */
export const ESTADOS_CURSO_AHBB = {
  PROGRAMADO: 'programado',
  ACTIVO: 'activo',
  EN_CURSO: 'en_curso',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
};

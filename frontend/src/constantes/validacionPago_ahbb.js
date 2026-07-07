/**
 * validacionPago_ahbb.js
 * Constante y función de validación para referencias de pago móvil venezolanas.
 *
 * Estándar definido:
 *  - Solo dígitos (0-9)
 *  - Mínimo 8 dígitos, máximo 20 dígitos
 *  - Compatible con Pago Móvil, transferencias bancarias y referencias de operación
 *    de los principales bancos venezolanos (Banesco, Mercantil, BDV, BOD, etc.)
 */

export const REFERENCIA_PAGO_REGEX_AHBB = /^\d{8,20}$/;
export const REFERENCIA_MIN_DIGITOS_AHBB = 8;
export const REFERENCIA_MAX_DIGITOS_AHBB = 20;

/**
 * Valida si una referencia de pago cumple el estándar.
 * @param {string} referencia
 * @returns {{ valido: boolean, mensaje: string }}
 */
export const validarReferenciaPago_ahbb = (referencia) => {
  if (!referencia || typeof referencia !== 'string') {
    return { valido: false, mensaje: 'El número de referencia es obligatorio.' };
  }
  const limpia = referencia.trim();
  if (!/^\d+$/.test(limpia)) {
    return { valido: false, mensaje: 'La referencia solo puede contener dígitos numéricos (0-9).' };
  }
  if (limpia.length < REFERENCIA_MIN_DIGITOS_AHBB) {
    return { valido: false, mensaje: `La referencia debe tener al menos ${REFERENCIA_MIN_DIGITOS_AHBB} dígitos.` };
  }
  if (limpia.length > REFERENCIA_MAX_DIGITOS_AHBB) {
    return { valido: false, mensaje: `La referencia no puede exceder ${REFERENCIA_MAX_DIGITOS_AHBB} dígitos.` };
  }
  return { valido: true, mensaje: '' };
};

/**
 * Reglas de validación para usar directamente en q-input (:rules="reglaReferencia_ahbb")
 */
export const reglaReferenciaPago_ahbb = [
  (v) => !!v || 'El número de referencia es obligatorio.',
  (v) => /^\d+$/.test(v) || 'Solo se permiten dígitos numéricos (0-9).',
  (v) => v.length >= REFERENCIA_MIN_DIGITOS_AHBB || `Mínimo ${REFERENCIA_MIN_DIGITOS_AHBB} dígitos.`,
  (v) => v.length <= REFERENCIA_MAX_DIGITOS_AHBB || `Máximo ${REFERENCIA_MAX_DIGITOS_AHBB} dígitos.`,
];

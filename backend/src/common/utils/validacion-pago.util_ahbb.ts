/**
 * validacion-pago.util_ahbb.ts
 * Utilidad de validación de referencias de pago venezolanas para el backend NestJS.
 *
 * Estándar: solo dígitos, entre 8 y 20 caracteres.
 */

import { BadRequestException } from '@nestjs/common';

export const REFERENCIA_REGEX_AHBB = /^\d{8,20}$/;
export const REFERENCIA_MIN_AHBB = 8;
export const REFERENCIA_MAX_AHBB = 20;

/**
 * Lanza BadRequestException si la referencia no cumple el estándar.
 * Usar como "trigger" antes de cualquier persistencia.
 */
export function validarReferenciaPago_ahbb(referencia: string | null | undefined): void {
  if (!referencia || typeof referencia !== 'string') {
    throw new BadRequestException('El número de referencia de pago es obligatorio.');
  }

  const limpia = referencia.trim();

  if (!/^\d+$/.test(limpia)) {
    throw new BadRequestException(
      'La referencia de pago solo puede contener dígitos numéricos (0–9). No se permiten letras, espacios ni caracteres especiales.',
    );
  }

  if (limpia.length < REFERENCIA_MIN_AHBB) {
    throw new BadRequestException(
      `La referencia de pago debe tener al menos ${REFERENCIA_MIN_AHBB} dígitos.`,
    );
  }

  if (limpia.length > REFERENCIA_MAX_AHBB) {
    throw new BadRequestException(
      `La referencia de pago no puede exceder ${REFERENCIA_MAX_AHBB} dígitos.`,
    );
  }
}

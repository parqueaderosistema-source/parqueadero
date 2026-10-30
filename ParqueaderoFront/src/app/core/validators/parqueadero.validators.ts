import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Misma normalización que el back:
 * mayúsculas, sin espacios ni guiones. " abc-456 " → "ABC456"
 */
export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[\s-]+/g, '');
}

/**
 * Acepta letras, números, espacios y guiones.
 * El largo (3 a 20) se cuenta solo con letras y números.
 */
export function placaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '');

    if (!valor.trim()) {
      return null;
    }

    if (!/^[A-Za-z0-9\s-]+$/.test(valor)) {
      return { placaCaracteres: true };
    }

    const largo = normalizarPlaca(valor).length;

    if (largo < 3 || largo > 20) {
      return { placaLongitud: { largo } };
    }

    return null;
  };
}

/**
 * Exige un número entero (pesos sin decimales).
 */
export function enteroValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;

    if (valor === null || valor === '') {
      return null;
    }

    return Number.isInteger(Number(valor)) ? null : { entero: true };
  };
}

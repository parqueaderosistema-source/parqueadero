import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';

import { Router } from '@angular/router';

import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Las rutas de /api/auth manejan su propio 401
 * (login incorrecto, /me sin sesión) y no deben redirigir.
 */
function esRutaDeSesion(url: string): boolean {
  return url.includes('/api/auth/');
}

/**
 * Si la sesión expiró (401) en cualquier otra petición,
 * se limpia la sesión local y se envía al login.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !esRutaDeSesion(request.url)
      ) {
        auth.limpiarSesion();

        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};

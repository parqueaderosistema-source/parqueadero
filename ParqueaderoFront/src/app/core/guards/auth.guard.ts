import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;
  }

  return auth.comprobarSesion().pipe(
    map((autenticado) => {
      if (autenticado) {
        return true;
      }

      return router.createUrlTree(['/login']);
    }),
  );
};

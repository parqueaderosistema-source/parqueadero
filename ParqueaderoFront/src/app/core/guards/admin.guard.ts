import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  const router = inject(Router);

  const verificarRol = () => {
    const usuario = auth.obtenerUsuario();

    if (usuario?.rol === 'administrador') {
      return true;
    }

    return router.createUrlTree(['/trabajador']);
  };

  if (auth.estaAutenticado()) {
    return verificarRol();
  }

  return auth.comprobarSesion().pipe(
    map((autenticado) => {
      if (!autenticado) {
        return router.createUrlTree(['/login']);
      }

      return verificarRol();
    }),
  );
};

import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { map } from 'rxjs';

import { RUTA_INICIO_POR_ROL, RolUsuario } from '../models/usuario.model';
import { AuthService } from '../services/auth.service';

/**
 * Permite el paso solo a los roles indicados.
 * Sin sesión envía al login; con otro rol, a su propio panel.
 * La autorización real la hace el back: esto solo evita mostrar
 * pantallas que el usuario no puede usar.
 */
export function rolGuard(...rolesPermitidos: RolUsuario[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);

    const router = inject(Router);

    const decidir = () => {
      const usuario = auth.obtenerUsuario();

      if (!usuario) {
        return router.createUrlTree(['/login']);
      }

      if (rolesPermitidos.includes(usuario.rol)) {
        return true;
      }

      return router.createUrlTree([RUTA_INICIO_POR_ROL[usuario.rol]]);
    };

    if (auth.estaAutenticado()) {
      return decidir();
    }

    return auth.comprobarSesion().pipe(map(() => decidir()));
  };
}

export const adminGuard = rolGuard('administrador');

/**
 * El administrador también puede usar el panel operativo.
 */
export const trabajadorGuard = rolGuard('trabajador', 'administrador');

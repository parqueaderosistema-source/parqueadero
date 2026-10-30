import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { trabajadorGuard } from './core/guards/trabajador.guard';
import { RUTAS_OPERACION } from './features/operacion/operacion.routes';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },

  {
    path: 'admin',
    canActivate: [adminGuard],

    loadComponent: () =>
      import('./features/admin/layout-admin/layout-admin').then(
        (m) => m.LayoutAdmin,
      ),

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard-admin/dashboard-admin').then(
            (m) => m.DashboardAdmin,
          ),
      },

      ...RUTAS_OPERACION,

      {
        path: 'historial',
        loadComponent: () =>
          import('./features/admin/historial/historial').then(
            (m) => m.Historial,
          ),
      },
    ],
  },

  {
    path: 'trabajador',
    canActivate: [trabajadorGuard],

    loadComponent: () =>
      import('./features/trabajador/layout-trabajador/layout-trabajador').then(
        (m) => m.LayoutTrabajador,
      ),

    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/trabajador/dashboard-trabajador/dashboard-trabajador').then(
            (m) => m.DashboardTrabajador,
          ),
      },

      ...RUTAS_OPERACION,
    ],
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];

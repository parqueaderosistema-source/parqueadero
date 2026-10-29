import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { trabajadorGuard } from './core/guards/trabajador.guard';

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
      import('./features/admin/dashboard-admin/dashboard-admin').then(
        (m) => m.DashboardAdmin,
      ),
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

      {
        path: 'entrada',
        loadComponent: () =>
          import('./features/trabajador/registrar-entrada/registrar-entrada').then(
            (m) => m.RegistrarEntrada,
          ),
      },

      {
        path: 'salida',
        loadComponent: () =>
          import('./features/trabajador/registrar-salida/registrar-salida').then(
            (m) => m.RegistrarSalida,
          ),
      },

      {
        path: 'vehiculos',
        loadComponent: () =>
          import('./features/trabajador/vehiculos-dentro/vehiculos-dentro').then(
            (m) => m.VehiculosDentro,
          ),
      },

      {
        path: 'caja',
        loadComponent: () =>
          import('./features/trabajador/caja-diaria/caja-diaria').then(
            (m) => m.CajaDiaria,
          ),
      },
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

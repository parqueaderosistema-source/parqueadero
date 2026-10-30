import { Routes } from '@angular/router';

/**
 * Pantallas operativas compartidas por el trabajador
 * y el administrador (/trabajador/... y /admin/...).
 * Ninguna usa enlaces absolutos, por eso funcionan en ambos paneles.
 */
export const RUTAS_OPERACION: Routes = [
  {
    path: 'entrada',
    loadComponent: () =>
      import('../trabajador/registrar-entrada/registrar-entrada').then(
        (m) => m.RegistrarEntrada,
      ),
  },

  {
    path: 'salida',
    loadComponent: () =>
      import('../trabajador/registrar-salida/registrar-salida').then(
        (m) => m.RegistrarSalida,
      ),
  },

  {
    path: 'vehiculos',
    loadComponent: () =>
      import('../trabajador/vehiculos-dentro/vehiculos-dentro').then(
        (m) => m.VehiculosDentro,
      ),
  },

  {
    path: 'caja',
    loadComponent: () =>
      import('../trabajador/caja-diaria/caja-diaria').then(
        (m) => m.CajaDiaria,
      ),
  },
];

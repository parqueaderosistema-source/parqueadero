import { Component } from '@angular/core';

import { PanelLayout } from '../../../shared/components/panel-layout/panel-layout';
import { GrupoMenu } from '../../../shared/components/menu-navegacion/menu.model';

/**
 * Trabajadores y Auditoría se agregarán cuando
 * el back publique sus endpoints.
 */
const MENU_ADMIN: GrupoMenu[] = [
  {
    titulo: 'Operación',
    enlaces: [
      { etiqueta: 'Inicio', ruta: '/admin', exacto: true },
      { etiqueta: 'Registrar entrada', ruta: '/admin/entrada' },
      { etiqueta: 'Registrar salida', ruta: '/admin/salida' },
      { etiqueta: 'Vehículos dentro', ruta: '/admin/vehiculos' },
      { etiqueta: 'Caja diaria', ruta: '/admin/caja' },
    ],
  },
];

@Component({
  selector: 'app-layout-admin',

  standalone: true,

  imports: [PanelLayout],

  template: `
    <app-panel-layout
      [grupos]="menu"
      titulo="Panel de administración"
      subtitulo="Administración"
    />
  `,
})
export class LayoutAdmin {
  readonly menu = MENU_ADMIN;
}

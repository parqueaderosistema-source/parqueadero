import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Topbar } from '../../../shared/components/topbar/topbar';
import { GrupoMenu } from '../../../shared/components/menu-navegacion/menu.model';

const MENU_TRABAJADOR: GrupoMenu[] = [
  {
    enlaces: [
      { etiqueta: 'Inicio', ruta: '/trabajador', exacto: true },
      { etiqueta: 'Registrar entrada', ruta: '/trabajador/entrada' },
      { etiqueta: 'Registrar salida', ruta: '/trabajador/salida' },
      { etiqueta: 'Vehículos dentro', ruta: '/trabajador/vehiculos' },
      { etiqueta: 'Caja diaria', ruta: '/trabajador/caja' },
    ],
  },
];

@Component({
  selector: 'app-layout-trabajador',

  standalone: true,

  imports: [RouterOutlet, Sidebar, Topbar],

  templateUrl: './layout-trabajador.html',

  styleUrl: './layout-trabajador.css',
})
export class LayoutTrabajador {
  readonly menu = MENU_TRABAJADOR;
}

import { Component, input } from '@angular/core';

import { MenuNavegacion } from '../menu-navegacion/menu-navegacion';

import { GrupoMenu } from '../menu-navegacion/menu.model';

@Component({
  selector: 'app-sidebar',

  standalone: true,

  imports: [MenuNavegacion],

  templateUrl: './sidebar.html',

  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly grupos = input.required<GrupoMenu[]>();

  readonly subtitulo = input('Panel operativo');

  readonly nombreUsuario = input('');

  readonly rolUsuario = input('');
}

import { Component, input, output } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { GrupoMenu } from './menu.model';

/**
 * Lista de enlaces por grupos. La usan el sidebar de escritorio
 * y el menú móvil, en el panel del trabajador y en el del admin.
 */
@Component({
  selector: 'app-menu-navegacion',

  standalone: true,

  imports: [RouterLink, RouterLinkActive],

  templateUrl: './menu-navegacion.html',
})
export class MenuNavegacion {
  readonly grupos = input.required<GrupoMenu[]>();

  /**
   * Se emite al hacer clic en un enlace
   * (el menú móvil lo usa para cerrarse).
   */
  readonly navegar = output<void>();
}

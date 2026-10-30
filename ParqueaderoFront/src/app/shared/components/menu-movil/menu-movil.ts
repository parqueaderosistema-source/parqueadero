import { Component, HostListener, input, output } from '@angular/core';

import { MenuNavegacion } from '../menu-navegacion/menu-navegacion';

import { GrupoMenu } from '../menu-navegacion/menu.model';

/**
 * Panel lateral para celular y tablet (< lg),
 * con las mismas rutas del sidebar y el cierre de sesión.
 */
@Component({
  selector: 'app-menu-movil',

  standalone: true,

  imports: [MenuNavegacion],

  templateUrl: './menu-movil.html',
})
export class MenuMovil {
  readonly abierto = input(false);

  readonly grupos = input.required<GrupoMenu[]>();

  readonly subtitulo = input('');

  readonly nombreUsuario = input('');

  readonly rolUsuario = input('');

  readonly cerrandoSesion = input(false);

  readonly cerrar = output<void>();

  readonly cerrarSesion = output<void>();

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.abierto()) {
      this.cerrar.emit();
    }
  }
}

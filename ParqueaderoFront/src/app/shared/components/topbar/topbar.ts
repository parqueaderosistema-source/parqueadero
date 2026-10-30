import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-topbar',

  standalone: true,

  templateUrl: './topbar.html',

  styleUrl: './topbar.css',
})
export class Topbar {
  readonly titulo = input('Panel de trabajo');

  readonly nombreUsuario = input('');

  readonly correoUsuario = input('');

  readonly rolUsuario = input('');

  readonly cerrandoSesion = input(false);

  readonly abrirMenu = output<void>();

  readonly cerrarSesion = output<void>();
}

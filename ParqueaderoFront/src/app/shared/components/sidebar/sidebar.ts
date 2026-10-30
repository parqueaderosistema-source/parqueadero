import { Component, computed, inject, input } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

import { ETIQUETA_ROL } from '../../../core/models/usuario.model';

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
  private readonly auth = inject(AuthService);

  readonly grupos = input.required<GrupoMenu[]>();

  readonly subtitulo = input('Panel operativo');

  readonly nombreUsuario = computed(
    () => this.auth.usuario()?.nombre || 'Sesión activa',
  );

  readonly rolUsuario = computed(() => {
    const rol = this.auth.usuario()?.rol;

    return rol ? ETIQUETA_ROL[rol] : '';
  });
}

import { Component, computed, inject, input, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { filter, finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

import { ETIQUETA_ROL } from '../../../core/models/usuario.model';

import { MenuMovil } from '../menu-movil/menu-movil';

import { GrupoMenu } from '../menu-navegacion/menu.model';

import { Sidebar } from '../sidebar/sidebar';

import { Topbar } from '../topbar/topbar';

/**
 * Estructura común de los paneles (trabajador y administrador):
 * sidebar en escritorio, menú hamburguesa en celular, topbar y contenido.
 */
@Component({
  selector: 'app-panel-layout',

  standalone: true,

  imports: [RouterOutlet, Sidebar, Topbar, MenuMovil],

  templateUrl: './panel-layout.html',
})
export class PanelLayout {
  private readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  readonly grupos = input.required<GrupoMenu[]>();

  readonly titulo = input('Panel de trabajo');

  readonly subtitulo = input('Panel operativo');

  readonly menuAbierto = signal(false);

  readonly cerrandoSesion = signal(false);

  /**
   * nombre y correo llegan en /api/auth/me y en el login;
   * si faltan se muestra "Sesión activa".
   */
  readonly nombreUsuario = computed(
    () => this.auth.usuario()?.nombre || 'Sesión activa',
  );

  readonly correoUsuario = computed(() => this.auth.usuario()?.correo ?? '');

  readonly rolUsuario = computed(() => {
    const rol = this.auth.usuario()?.rol;

    return rol ? ETIQUETA_ROL[rol] : '';
  });

  constructor() {
    /**
     * Cierra el menú móvil también al navegar
     * con el botón "atrás" del navegador.
     */
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuAbierto.set(false);
      });
  }

  cerrarSesion(): void {
    if (this.cerrandoSesion()) {
      return;
    }

    this.cerrandoSesion.set(true);

    this.auth
      .logout()
      .pipe(
        finalize(() => {
          this.cerrandoSesion.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.menuAbierto.set(false);

          void this.router.navigate(['/login']);
        },
      });
  }
}

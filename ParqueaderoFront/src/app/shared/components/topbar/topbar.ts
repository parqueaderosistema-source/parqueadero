import { Component, computed, inject, input, signal } from '@angular/core';

import { Router } from '@angular/router';

import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

import { ETIQUETA_ROL } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-topbar',

  standalone: true,

  templateUrl: './topbar.html',

  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  readonly titulo = input('Panel de trabajo');

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
          void this.router.navigate(['/login']);
        },
      });
  }
}

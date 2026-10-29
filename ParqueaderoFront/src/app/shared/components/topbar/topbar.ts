import { Component, computed, inject } from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',

  standalone: true,

  templateUrl: './topbar.html',

  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  readonly usuario = computed(() => this.auth.usuario());

  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}

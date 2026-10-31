import { Component, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { finalize } from 'rxjs';

import { RUTA_INICIO_POR_ROL } from '../../../core/models/usuario.model';

import { AuthService } from '../../../core/services/auth.service';

import { obtenerMensajeError } from '../../../core/utils/http-error';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [CommonModule, ReactiveFormsModule],

  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly cargando = signal(false);

  readonly mensajeError = signal('');

  readonly mostrarPassword = signal(false);

  readonly formulario;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {
    this.formulario = this.fb.nonNullable.group({
      correo: ['', [Validators.required, Validators.email]],

      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  alternarPassword(): void {
    this.mostrarPassword.update((valor) => !valor);
  }

  ingresar(): void {
    this.mensajeError.set('');

    if (this.formulario.invalid || this.cargando()) {
      this.formulario.markAllAsTouched();

      return;
    }

    this.cargando.set(true);

    const { correo, password } = this.formulario.getRawValue();

    this.auth
      .login(correo, password)
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          void this.router.navigate([
            RUTA_INICIO_POR_ROL[respuesta.usuario.rol],
          ]);
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible iniciar sesión.'),
          );
        },
      });
  }
}

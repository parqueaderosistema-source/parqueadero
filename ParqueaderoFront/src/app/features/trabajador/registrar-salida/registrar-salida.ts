import { Component, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { RegistroConTiempo } from '../../../core/models/parqueadero.model';

@Component({
  selector: 'app-registrar-salida',

  standalone: true,

  imports: [CommonModule, ReactiveFormsModule],

  templateUrl: './registrar-salida.html',

  styleUrl: './registrar-salida.css',
})
export class RegistrarSalida {
  readonly buscando = signal(false);

  readonly guardando = signal(false);

  readonly registro = signal<RegistroConTiempo | null>(null);

  readonly mensajeError = signal('');

  readonly mensajeExito = signal('');

  readonly formularioBusqueda;

  readonly formularioSalida;

  constructor(
    private readonly fb: FormBuilder,

    private readonly parqueaderoService: ParqueaderoService,
  ) {
    this.formularioBusqueda = this.fb.nonNullable.group({
      placa: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9-]+$/),
        ],
      ],
    });

    this.formularioSalida = this.fb.nonNullable.group({
      valorCobrado: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100000000)],
      ],

      observacion: ['', Validators.maxLength(500)],
    });
  }

  convertirPlacaMayusculas(): void {
    const control = this.formularioBusqueda.controls.placa;

    control.setValue(control.value.toUpperCase().replace(/\s+/g, ''), {
      emitEvent: false,
    });
  }

  buscar(): void {
    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.registro.set(null);

    if (this.formularioBusqueda.invalid || this.buscando()) {
      this.formularioBusqueda.markAllAsTouched();

      return;
    }

    const placa = this.formularioBusqueda.controls.placa.value
      .trim()
      .toUpperCase();

    this.buscando.set(true);

    this.parqueaderoService
      .buscarVehiculoPorPlaca(placa)
      .pipe(
        finalize(() => {
          this.buscando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.registro.set(respuesta.registro);

          this.formularioSalida.reset({
            valorCobrado: 0,
            observacion: '',
          });
        },

        error: (error) => {
          this.mensajeError.set(
            error?.error?.message ?? 'No se encontró el vehículo.',
          );
        },
      });
  }

  confirmarSalida(): void {
    const vehiculo = this.registro();

    if (!vehiculo || this.formularioSalida.invalid || this.guardando()) {
      this.formularioSalida.markAllAsTouched();

      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');

    const datos = this.formularioSalida.getRawValue();

    this.guardando.set(true);

    this.parqueaderoService
      .registrarSalida(vehiculo.placa, {
        valorCobrado: Number(datos.valorCobrado),

        observacion: datos.observacion.trim(),
      })
      .pipe(
        finalize(() => {
          this.guardando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.mensajeExito.set(respuesta.message);

          this.registro.set(null);

          this.formularioBusqueda.reset({
            placa: '',
          });

          this.formularioSalida.reset({
            valorCobrado: 0,
            observacion: '',
          });
        },

        error: (error) => {
          this.mensajeError.set(
            error?.error?.message ?? 'No fue posible registrar la salida.',
          );
        },
      });
  }

  cancelar(): void {
    this.registro.set(null);

    this.formularioSalida.reset({
      valorCobrado: 0,
      observacion: '',
    });

    this.mensajeError.set('');
  }

  obtenerTiempo(): string {
    const tiempo = this.registro()?.tiempoTranscurrido;

    if (!tiempo) {
      return '';
    }

    const partes: string[] = [];

    if (tiempo.dias > 0) {
      partes.push(`${tiempo.dias} ${tiempo.dias === 1 ? 'día' : 'días'}`);
    }

    if (tiempo.horas > 0) {
      partes.push(`${tiempo.horas} h`);
    }

    partes.push(`${tiempo.minutos} min`);

    return partes.join(' ');
  }
}

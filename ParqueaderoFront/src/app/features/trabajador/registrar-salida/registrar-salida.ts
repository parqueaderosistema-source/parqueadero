import { Component, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { RegistroConTiempo } from '../../../core/models/parqueadero.model';

import {
  obtenerErroresDeCampo,
  obtenerEstadoHttp,
  obtenerMensajeError,
} from '../../../core/utils/http-error';

import {
  enteroValidator,
  normalizarPlaca,
  placaValidator,
} from '../../../core/validators/parqueadero.validators';

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

  /**
   * Error del campo valorCobrado devuelto por el servidor (400).
   */
  readonly errorValorServidor = signal('');

  readonly formularioBusqueda;

  readonly formularioSalida;

  constructor(
    private readonly fb: FormBuilder,

    private readonly parqueaderoService: ParqueaderoService,
  ) {
    this.formularioBusqueda = this.fb.nonNullable.group({
      placa: ['', [Validators.required, placaValidator()]],
    });

    this.formularioSalida = this.fb.nonNullable.group({
      valorCobrado: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(1),
        Validators.max(100000000),
        enteroValidator(),
      ]),

      observacion: ['', Validators.maxLength(500)],
    });
  }

  /**
   * Indica si hay una petición en curso
   * (para deshabilitar todos los botones).
   */
  ocupado(): boolean {
    return this.buscando() || this.guardando();
  }

  convertirPlacaMayusculas(): void {
    const control = this.formularioBusqueda.controls.placa;

    control.setValue(control.value.toUpperCase(), {
      emitEvent: false,
    });
  }

  buscar(): void {
    if (this.ocupado()) {
      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.registro.set(null);

    if (this.formularioBusqueda.invalid) {
      this.formularioBusqueda.markAllAsTouched();

      return;
    }

    const placa = normalizarPlaca(this.formularioBusqueda.controls.placa.value);

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

          this.reiniciarCobro();
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible buscar el vehículo.', {
              404: `No hay ningún vehículo dentro del parqueadero con la placa ${placa}.`,
              500: 'Ocurrió un error interno al buscar el vehículo. Intenta de nuevo.',
            }),
          );
        },
      });
  }

  confirmarSalida(): void {
    const vehiculo = this.registro();

    if (!vehiculo || this.ocupado()) {
      return;
    }

    this.errorValorServidor.set('');

    if (this.formularioSalida.invalid) {
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

          this.reiniciarCobro();
        },

        error: (error) => {
          const errorValor = obtenerErroresDeCampo(error)['valorCobrado'];

          if (errorValor) {
            this.errorValorServidor.set(errorValor);

            return;
          }

          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible registrar la salida.', {
              404: `No existe ningún registro para la placa ${vehiculo.placa}.`,
              409: `El vehículo con placa ${vehiculo.placa} ya fue retirado o anulado.`,
              500: 'Ocurrió un error interno al registrar la salida. Intenta de nuevo.',
            }),
          );

          /**
           * 404 y 409: el vehículo ya no está dentro,
           * no tiene sentido mantener el formulario de cobro.
           */
          const estado = obtenerEstadoHttp(error);

          if (estado === 404 || estado === 409) {
            this.registro.set(null);
          }
        },
      });
  }

  cancelar(): void {
    if (this.guardando()) {
      return;
    }

    this.registro.set(null);

    this.reiniciarCobro();

    this.mensajeError.set('');
  }

  private reiniciarCobro(): void {
    this.formularioSalida.reset({
      valorCobrado: null,
      observacion: '',
    });

    this.errorValorServidor.set('');
  }

  /**
   * Valor cobrado formateado para la confirmación,
   * o vacío si todavía no es válido.
   */
  valorCobradoFormateado(): string {
    const control = this.formularioSalida.controls.valorCobrado;

    if (control.invalid || control.value === null) {
      return '';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(control.value);
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

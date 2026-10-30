import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { TiposVehiculoService } from '../../../core/services/tipos-vehiculo.service';

import { TipoVehiculo } from '../../../core/models/parqueadero.model';

import {
  obtenerErroresDeCampo,
  obtenerMensajeError,
} from '../../../core/utils/http-error';

import { placaValidator } from '../../../core/validators/parqueadero.validators';

@Component({
  selector: 'app-registrar-entrada',

  standalone: true,

  imports: [CommonModule, ReactiveFormsModule],

  templateUrl: './registrar-entrada.html',

  styleUrl: './registrar-entrada.css',
})
export class RegistrarEntrada implements OnInit {
  readonly tiposVehiculo = signal<TipoVehiculo[]>([]);

  readonly cargandoTipos = signal(true);

  readonly guardando = signal(false);

  readonly mensajeExito = signal('');

  readonly mensajeError = signal('');

  readonly mostrarTipoPersonalizado = signal(false);

  /**
   * Errores por campo que devuelve el servidor (400).
   */
  readonly erroresServidor = signal<Record<string, string>>({});

  readonly formulario;

  constructor(
    private readonly fb: FormBuilder,

    private readonly parqueaderoService: ParqueaderoService,

    private readonly tiposVehiculoService: TiposVehiculoService,
  ) {
    this.formulario = this.fb.nonNullable.group({
      placa: ['', [Validators.required, placaValidator()]],

      tipoVehiculoId: ['', Validators.required],

      tipoVehiculoPersonalizado: ['', Validators.maxLength(80)],

      tiempoEstimado: ['', Validators.maxLength(100)],

      observacion: ['', Validators.maxLength(500)],
    });
  }

  ngOnInit(): void {
    this.cargarTiposVehiculo();
  }

  private cargarTiposVehiculo(): void {
    this.cargandoTipos.set(true);

    this.tiposVehiculoService
      .obtenerActivos()
      .pipe(
        finalize(() => {
          this.cargandoTipos.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.tiposVehiculo.set(respuesta.tipos);
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(
              error,
              'No fue posible cargar los tipos de vehículo.',
            ),
          );
        },
      });
  }

  /**
   * Solo pasa a mayúsculas; los espacios y guiones
   * se conservan porque el servidor normaliza la placa.
   */
  convertirPlacaMayusculas(): void {
    const control = this.formulario.controls.placa;

    control.setValue(control.value.toUpperCase(), {
      emitEvent: false,
    });

    this.limpiarErrorServidor('placa');
  }

  limpiarErrorServidor(campo: string): void {
    if (!this.erroresServidor()[campo]) {
      return;
    }

    const errores = { ...this.erroresServidor() };

    delete errores[campo];

    this.erroresServidor.set(errores);
  }

  cambioTipoVehiculo(): void {
    const tipoId = this.formulario.controls.tipoVehiculoId.value;

    const tipoSeleccionado = this.tiposVehiculo().find(
      (tipo) => tipo._id === tipoId,
    );

    const esOtro = tipoSeleccionado?.nombre.trim().toLowerCase() === 'otro';

    this.mostrarTipoPersonalizado.set(esOtro);

    /**
     * Si cambia de "Otro" a otro tipo,
     * limpiamos el campo personalizado.
     */
    if (!esOtro) {
      this.formulario.controls.tipoVehiculoPersonalizado.setValue('');
    }
  }

  limpiarFormulario(): void {
    this.formulario.reset({
      placa: '',
      tipoVehiculoId: '',
      tipoVehiculoPersonalizado: '',
      tiempoEstimado: '',
      observacion: '',
    });

    this.mostrarTipoPersonalizado.set(false);

    this.erroresServidor.set({});

    this.mensajeError.set('');
    this.mensajeExito.set('');
  }

  registrar(): void {
    if (this.guardando()) {
      return;
    }

    this.mensajeExito.set('');
    this.mensajeError.set('');
    this.erroresServidor.set({});

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      return;
    }

    const datos = this.formulario.getRawValue();

    /**
     * Si seleccionaron "Otro",
     * deben escribir qué vehículo es.
     */
    if (
      this.mostrarTipoPersonalizado() &&
      !datos.tipoVehiculoPersonalizado.trim()
    ) {
      this.mensajeError.set('Debes especificar el tipo de vehículo.');

      return;
    }

    this.guardando.set(true);

    this.parqueaderoService
      .registrarEntrada({
        placa: datos.placa.trim().toUpperCase(),

        tipoVehiculoId: datos.tipoVehiculoId,

        tipoVehiculoPersonalizado: this.mostrarTipoPersonalizado()
          ? datos.tipoVehiculoPersonalizado.trim()
          : '',

        tiempoEstimado: datos.tiempoEstimado.trim(),

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

          this.formulario.reset({
            placa: '',
            tipoVehiculoId: '',
            tipoVehiculoPersonalizado: '',
            tiempoEstimado: '',
            observacion: '',
          });

          this.mostrarTipoPersonalizado.set(false);
        },

        error: (error) => {
          /**
           * 400 con "errores": se muestran bajo cada campo.
           * 400 sin "errores", 409 y 500: se muestra el message.
           */
          const errores = obtenerErroresDeCampo(error);

          if (Object.keys(errores).length > 0) {
            this.erroresServidor.set(errores);

            return;
          }

          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible registrar la entrada.'),
          );
        },
      });
  }
}

import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { TipoVehiculo } from '../../../core/models/parqueadero.model';

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

  readonly formulario;

  constructor(
    private readonly fb: FormBuilder,

    private readonly parqueaderoService: ParqueaderoService,
  ) {
    this.formulario = this.fb.nonNullable.group({
      placa: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9-]+$/),
        ],
      ],

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

    this.parqueaderoService
      .obtenerTiposVehiculo()
      .pipe(
        finalize(() => {
          this.cargandoTipos.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.tiposVehiculo.set(respuesta.tipos);
        },

        error: () => {
          this.mensajeError.set('No fue posible cargar los tipos de vehículo.');
        },
      });
  }

  convertirPlacaMayusculas(): void {
    const control = this.formulario.controls.placa;

    const valor = control.value.toUpperCase().replace(/\s+/g, '');

    control.setValue(valor, {
      emitEvent: false,
    });
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

    this.mensajeError.set('');
    this.mensajeExito.set('');
  }

  registrar(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');

    if (this.formulario.invalid || this.guardando()) {
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
          this.mensajeError.set(
            error?.error?.message ?? 'No fue posible registrar la entrada.',
          );
        },
      });
  }
}

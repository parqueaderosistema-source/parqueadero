import { Component, OnInit, inject, signal } from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { finalize } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';

import { TipoVehiculoAdmin } from '../../../core/models/admin.model';

import { obtenerMensajeError } from '../../../core/utils/http-error';

const MENSAJE_DUPLICADO = 'Ya existe un tipo de vehículo con ese nombre';

/**
 * Mismo criterio del back: 2 a 80 caracteres sin contar espacios de los extremos.
 */
function nombreValido(control: AbstractControl): ValidationErrors | null {
  const largo = String(control.value ?? '').trim().length;

  if (largo === 0) {
    return { required: true };
  }

  return largo < 2 ? { minimo: true } : null;
}

/**
 * Al renombrar, un nombre repetido llega como error de índice único
 * de MongoDB (E11000); se muestra un mensaje legible.
 */
function mensajeErrorTipo(error: unknown, porDefecto: string): string {
  const mensaje = obtenerMensajeError(error, porDefecto);

  return mensaje.includes('E11000') ? MENSAJE_DUPLICADO : mensaje;
}

@Component({
  selector: 'app-tipos-vehiculo',

  standalone: true,

  imports: [ReactiveFormsModule],

  templateUrl: './tipos-vehiculo.html',
})
export class TiposVehiculo implements OnInit {
  private readonly adminService = inject(AdminService);

  private readonly fb = inject(FormBuilder);

  readonly tipos = signal<TipoVehiculoAdmin[]>([]);

  readonly cargando = signal(true);

  readonly mensajeError = signal('');

  readonly mensajeExito = signal('');

  readonly creando = signal(false);

  readonly errorCrear = signal('');

  /**
   * Tipo que se está renombrando, o null.
   */
  readonly editandoId = signal<string | null>(null);

  readonly errorEditar = signal('');

  /**
   * Tipo con una petición en curso (renombrar o activar/desactivar).
   */
  readonly procesandoId = signal<string | null>(null);

  readonly formularioCrear = this.fb.nonNullable.group({
    nombre: ['', [nombreValido, Validators.maxLength(80)]],
  });

  readonly formularioEditar = this.fb.nonNullable.group({
    nombre: ['', [nombreValido, Validators.maxLength(80)]],
  });

  ngOnInit(): void {
    this.cargarTipos();
  }

  cargarTipos(): void {
    this.cargando.set(true);

    this.mensajeError.set('');

    this.adminService
      .obtenerTiposVehiculo()
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.tipos.set(respuesta.tipos ?? []);
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

  crear(): void {
    if (this.creando()) {
      return;
    }

    this.errorCrear.set('');
    this.mensajeExito.set('');

    if (this.formularioCrear.invalid) {
      this.formularioCrear.markAllAsTouched();

      return;
    }

    const nombre = this.formularioCrear.controls.nombre.value.trim();

    if (this.nombreRepetido(nombre)) {
      this.errorCrear.set(MENSAJE_DUPLICADO);

      return;
    }

    this.creando.set(true);

    this.adminService
      .crearTipoVehiculo(nombre)
      .pipe(
        finalize(() => {
          this.creando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.mensajeExito.set(respuesta.message);

          this.formularioCrear.reset({ nombre: '' });

          this.cargarTipos();
        },

        error: (error) => {
          this.errorCrear.set(
            mensajeErrorTipo(error, 'No fue posible crear el tipo de vehículo.'),
          );
        },
      });
  }

  iniciarEdicion(tipo: TipoVehiculoAdmin): void {
    if (this.procesandoId()) {
      return;
    }

    this.editandoId.set(tipo._id);

    this.errorEditar.set('');

    this.formularioEditar.reset({ nombre: tipo.nombre });
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);

    this.errorEditar.set('');
  }

  guardarNombre(tipo: TipoVehiculoAdmin): void {
    if (this.procesandoId()) {
      return;
    }

    this.errorEditar.set('');
    this.mensajeExito.set('');

    if (this.formularioEditar.invalid) {
      this.formularioEditar.markAllAsTouched();

      return;
    }

    const nombre = this.formularioEditar.controls.nombre.value.trim();

    if (nombre === tipo.nombre) {
      this.cancelarEdicion();

      return;
    }

    if (this.nombreRepetido(nombre, tipo._id)) {
      this.errorEditar.set(MENSAJE_DUPLICADO);

      return;
    }

    this.procesandoId.set(tipo._id);

    this.adminService
      .actualizarTipoVehiculo(tipo._id, { nombre })
      .pipe(
        finalize(() => {
          this.procesandoId.set(null);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.reemplazarTipo(respuesta.tipo);

          this.mensajeExito.set(`Tipo renombrado a «${respuesta.tipo.nombre}».`);

          this.editandoId.set(null);
        },

        error: (error) => {
          this.errorEditar.set(
            mensajeErrorTipo(error, 'No fue posible renombrar el tipo.'),
          );
        },
      });
  }

  cambiarEstado(tipo: TipoVehiculoAdmin): void {
    if (this.procesandoId()) {
      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');

    this.procesandoId.set(tipo._id);

    this.adminService
      .actualizarTipoVehiculo(tipo._id, { activo: !tipo.activo })
      .pipe(
        finalize(() => {
          this.procesandoId.set(null);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.reemplazarTipo(respuesta.tipo);

          this.mensajeExito.set(
            `«${respuesta.tipo.nombre}» ${
              respuesta.tipo.activo ? 'activado' : 'desactivado'
            }.`,
          );
        },

        error: (error) => {
          this.mensajeError.set(
            mensajeErrorTipo(error, 'No fue posible cambiar el estado.'),
          );
        },
      });
  }

  private nombreRepetido(nombre: string, excluirId?: string): boolean {
    const buscado = nombre.toLowerCase();

    return this.tipos().some(
      (tipo) => tipo._id !== excluirId && tipo.nombre.toLowerCase() === buscado,
    );
  }

  /**
   * PATCH devuelve el documento sin pasar por el ajuste de
   * permitePersonalizado del listado; se conserva el valor conocido.
   */
  private reemplazarTipo(actualizado: TipoVehiculoAdmin): void {
    this.tipos.update((tipos) =>
      tipos.map((tipo) =>
        tipo._id === actualizado._id
          ? {
              ...tipo,
              ...actualizado,
              permitePersonalizado:
                actualizado.permitePersonalizado ?? tipo.permitePersonalizado,
            }
          : tipo,
      ),
    );
  }
}

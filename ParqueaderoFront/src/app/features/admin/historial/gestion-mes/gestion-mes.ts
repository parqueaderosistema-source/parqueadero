import { Component, computed, inject, input, output, signal } from '@angular/core';

import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';

import { AdminService } from '../../../../core/services/admin.service';

import {
  FormatoExportacion,
  PrepararEliminacionResponse,
} from '../../../../core/models/admin.model';

import { obtenerMensajeError } from '../../../../core/utils/http-error';

import { guardarArchivo } from '../../../../core/utils/descarga';

import { formatearDinero, formatearPeriodo } from '../../../../core/utils/formato';

/**
 * Descargar y eliminar el historial de un mes.
 * El texto de confirmación lo define el back (confirmacionRequerida).
 */
@Component({
  selector: 'app-gestion-mes',

  standalone: true,

  templateUrl: './gestion-mes.html',
})
export class GestionMes {
  private readonly adminService = inject(AdminService);

  readonly periodo = input.required<string>();

  /**
   * Totales de la tabla, para la vista previa
   * cuando el mes no se puede eliminar (mes actual).
   */
  readonly cantidadRegistros = input(0);

  readonly totalRecaudado = input(0);

  readonly eliminado = output<void>();

  readonly preparando = signal(false);

  readonly preparacion = signal<PrepararEliminacionResponse | null>(null);

  /**
   * Motivo por el que el mes no se puede eliminar (400 del back).
   */
  readonly motivoNoEliminable = signal('');

  readonly descargando = signal(false);

  readonly eliminando = signal(false);

  readonly confirmacion = signal('');

  readonly mensajeExito = signal('');

  readonly mensajeError = signal('');

  readonly formatearDinero = formatearDinero;

  readonly formatearPeriodo = formatearPeriodo;

  readonly ocupado = computed(
    () => this.preparando() || this.descargando() || this.eliminando(),
  );

  readonly cantidadVistaPrevia = computed(
    () => this.preparacion()?.cantidadRegistros ?? this.cantidadRegistros(),
  );

  readonly recaudoVistaPrevia = computed(
    () => this.preparacion()?.totalRecaudado ?? this.totalRecaudado(),
  );

  readonly puedeEliminar = computed(
    () => !!this.preparacion() && this.cantidadVistaPrevia() > 0,
  );

  readonly confirmacionCorrecta = computed(() => {
    const requerida = this.preparacion()?.confirmacionRequerida;

    return !!requerida && this.confirmacion().trim() === requerida;
  });

  constructor() {
    toObservable(this.periodo)
      .pipe(
        tap(() => {
          this.preparacion.set(null);
          this.motivoNoEliminable.set('');
          this.confirmacion.set('');
          this.mensajeError.set('');
          this.mensajeExito.set('');
          this.preparando.set(true);
        }),

        switchMap((periodo) =>
          this.adminService.prepararEliminacionMes(periodo).pipe(
            catchError((error) => {
              this.motivoNoEliminable.set(
                obtenerMensajeError(
                  error,
                  'Este mes no se puede eliminar.',
                ),
              );

              return of(null);
            }),

            finalize(() => {
              this.preparando.set(false);
            }),
          ),
        ),

        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        this.preparacion.set(respuesta);
      });
  }

  actualizarConfirmacion(valor: string): void {
    this.confirmacion.set(valor);
  }

  descargar(formato: FormatoExportacion): void {
    if (this.ocupado()) {
      return;
    }

    this.limpiarMensajes();

    this.descargarArchivo(formato).subscribe((exito) => {
      if (exito) {
        this.mensajeExito.set('Archivo descargado correctamente.');
      }
    });
  }

  /**
   * Solo elimina si la descarga del Excel fue exitosa.
   */
  descargarYEliminar(): void {
    if (this.ocupado() || !this.confirmacionCorrecta()) {
      return;
    }

    this.limpiarMensajes();

    this.descargarArchivo('xlsx').subscribe((exito) => {
      if (exito) {
        this.eliminar(true);
      }
    });
  }

  eliminarSinDescargar(): void {
    if (this.ocupado() || !this.confirmacionCorrecta()) {
      return;
    }

    this.limpiarMensajes();

    this.eliminar(false);
  }

  private descargarArchivo(formato: FormatoExportacion): Observable<boolean> {
    this.descargando.set(true);

    return this.adminService.descargarHistorialMes(this.periodo(), formato).pipe(
      map(({ archivo, nombre }) => {
        guardarArchivo(archivo, nombre);

        return true;
      }),

      catchError((error) => {
        this.mensajeError.set(
          obtenerMensajeError(
            error,
            'No fue posible descargar el archivo. No se eliminó nada.',
          ),
        );

        return of(false);
      }),

      finalize(() => {
        this.descargando.set(false);
      }),
    );
  }

  private eliminar(respaldoDescargado: boolean): void {
    this.eliminando.set(true);

    this.adminService
      .eliminarMes(this.periodo(), {
        confirmacion: this.confirmacion().trim(),
        respaldoDescargado,
      })
      .pipe(
        finalize(() => {
          this.eliminando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          const { cantidadEliminada } = respuesta.resultado;

          this.mensajeExito.set(
            `${respuesta.message}: ${cantidadEliminada} ${
              cantidadEliminada === 1 ? 'registro eliminado' : 'registros eliminados'
            }${respaldoDescargado ? ' (respaldo descargado)' : ''}.`,
          );

          this.confirmacion.set('');

          this.preparacion.set(null);

          this.eliminado.emit();
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible eliminar el historial.'),
          );
        },
      });
  }

  private limpiarMensajes(): void {
    this.mensajeError.set('');

    this.mensajeExito.set('');
  }
}

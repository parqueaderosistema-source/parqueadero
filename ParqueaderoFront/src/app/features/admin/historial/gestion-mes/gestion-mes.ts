import { Component, computed, inject, input, output, signal } from '@angular/core';

import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';

import { AdminService } from '../../../../core/services/admin.service';

import {
  ModoEliminacion,
  VistaPreviaEliminacionResponse,
} from '../../../../core/models/admin.model';

import { obtenerMensajeError } from '../../../../core/utils/http-error';

import { guardarArchivo } from '../../../../core/utils/descarga';

import { formatearDinero, formatearPeriodo } from '../../../../core/utils/formato';

/**
 * Descargar y eliminar el historial de un mes.
 * El texto de confirmación lo define el back ("ELIMINAR AAAA-MM").
 */
@Component({
  selector: 'app-gestion-mes',

  standalone: true,

  templateUrl: './gestion-mes.html',
})
export class GestionMes {
  private readonly adminService = inject(AdminService);

  readonly periodo = input.required<string>();

  readonly eliminado = output<void>();

  readonly preparando = signal(false);

  readonly vistaPrevia = signal<VistaPreviaEliminacionResponse | null>(null);

  readonly errorVistaPrevia = signal('');

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

  readonly confirmacionCorrecta = computed(() => {
    const requerida = this.vistaPrevia()?.confirmacionRequerida;

    return !!requerida && this.confirmacion().trim() === requerida;
  });

  constructor() {
    toObservable(this.periodo)
      .pipe(
        tap(() => {
          this.confirmacion.set('');
          this.mensajeError.set('');
          this.mensajeExito.set('');
        }),

        switchMap(() => this.cargarVistaPrevia()),

        takeUntilDestroyed(),
      )
      .subscribe();
  }

  actualizarConfirmacion(valor: string): void {
    this.confirmacion.set(valor);
  }

  descargar(): void {
    if (this.ocupado()) {
      return;
    }

    this.limpiarMensajes();

    this.descargarExcel().subscribe((exito) => {
      if (exito) {
        this.mensajeExito.set('Excel descargado correctamente.');
      }
    });
  }

  /**
   * Solo elimina si la descarga del Excel fue exitosa.
   * El back además verifica en la auditoría que la descarga ocurrió.
   */
  descargarYEliminar(): void {
    if (this.ocupado() || !this.confirmacionCorrecta()) {
      return;
    }

    this.limpiarMensajes();

    this.descargarExcel().subscribe((exito) => {
      if (exito) {
        this.eliminar('descargar-y-eliminar');
      }
    });
  }

  eliminarSinDescargar(): void {
    if (this.ocupado() || !this.confirmacionCorrecta()) {
      return;
    }

    this.limpiarMensajes();

    this.eliminar('sin-descargar');
  }

  private cargarVistaPrevia(): Observable<unknown> {
    this.vistaPrevia.set(null);

    this.errorVistaPrevia.set('');

    this.preparando.set(true);

    return this.adminService.prepararEliminacionMes(this.periodo()).pipe(
      tap((respuesta) => {
        this.vistaPrevia.set(respuesta);
      }),

      catchError((error) => {
        this.errorVistaPrevia.set(
          obtenerMensajeError(
            error,
            'No fue posible obtener la vista previa del mes.',
          ),
        );

        return of(null);
      }),

      finalize(() => {
        this.preparando.set(false);
      }),
    );
  }

  private descargarExcel(): Observable<boolean> {
    this.descargando.set(true);

    return this.adminService.descargarHistorialMes(this.periodo()).pipe(
      map(({ archivo, nombre }) => {
        guardarArchivo(archivo, nombre);

        return true;
      }),

      catchError((error) => {
        this.mensajeError.set(
          obtenerMensajeError(
            error,
            'No fue posible descargar el Excel. No se eliminó nada.',
          ),
        );

        return of(false);
      }),

      finalize(() => {
        this.descargando.set(false);
      }),
    );
  }

  private eliminar(modo: ModoEliminacion): void {
    this.eliminando.set(true);

    this.adminService
      .eliminarMes(this.periodo(), {
        confirmacion: this.confirmacion().trim(),
        modo,
        descargado: modo === 'descargar-y-eliminar',
      })
      .pipe(
        finalize(() => {
          this.eliminando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          const { cantidadEliminada, dentroConservados } = respuesta.resultado;

          const conservados =
            dentroConservados > 0
              ? ` Se conservaron ${dentroConservados} vehículos que siguen dentro.`
              : '';

          this.mensajeExito.set(
            `${respuesta.message}: ${cantidadEliminada} ${
              cantidadEliminada === 1 ? 'registro eliminado' : 'registros eliminados'
            }.${conservados}`,
          );

          this.confirmacion.set('');

          this.eliminado.emit();

          this.cargarVistaPrevia().subscribe();
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

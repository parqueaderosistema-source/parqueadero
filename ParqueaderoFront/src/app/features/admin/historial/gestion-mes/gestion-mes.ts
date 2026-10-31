import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';

import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import {
  EMPTY,
  Observable,
  catchError,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { HistorialService } from '../../../../core/services/historial.service';

import {
  MesHistorial,
  ModoEliminacion,
  VistaPreviaEliminacionResponse,
} from '../../../../core/models/admin.model';

import { obtenerMensajeError } from '../../../../core/utils/http-error';

import { guardarArchivo } from '../../../../core/utils/descarga';

import { formatearDinero, formatearPeriodo } from '../../../../core/utils/formato';

/**
 * Descargar y eliminar el historial de un mes.
 * El mes se elige aquí; arranca en el mes filtrado en la tabla.
 * El texto de confirmación lo define el back ("ELIMINAR AAAA-MM").
 */
@Component({
  selector: 'app-gestion-mes',

  standalone: true,

  templateUrl: './gestion-mes.html',
})
export class GestionMes {
  private readonly historialService = inject(HistorialService);

  readonly meses = input.required<MesHistorial[]>();

  /**
   * Mes filtrado en la tabla ('' si se filtra por rango).
   */
  readonly periodoInicial = input('');

  /**
   * Mes elegido para descargar/eliminar. Vuelve al de la tabla
   * cuando cambia el filtro o se recarga la lista de meses.
   */
  readonly periodo = linkedSignal(
    () => this.periodoInicial() || this.meses()[0]?.periodo || '',
  );

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

  /**
   * El mes elegido puede no estar en la lista (mes sin registros).
   */
  readonly periodoFueraDeLista = computed(
    () =>
      !!this.periodo() &&
      !this.meses().some((mes) => mes.periodo === this.periodo()),
  );

  seleccionarPeriodo(periodo: string): void {
    if (!this.ocupado()) {
      this.periodo.set(periodo);
    }
  }

  actualizarConfirmacion(valor: string): void {
    this.confirmacion.set(valor);
  }

  descargar(): void {
    if (this.ocupado() || !this.periodo()) {
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

    if (!this.periodo()) {
      return EMPTY;
    }

    this.preparando.set(true);

    return this.historialService.prepararEliminacionMes(this.periodo()).pipe(
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

    return this.historialService.descargarMes(this.periodo()).pipe(
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

    this.historialService
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

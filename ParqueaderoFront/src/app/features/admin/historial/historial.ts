import { Component, OnInit, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router } from '@angular/router';

import {
  BehaviorSubject,
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';

import {
  HistorialMesResponse,
  MesHistorial,
  RegistroHistorial,
} from '../../../core/models/admin.model';

import { obtenerMensajeError } from '../../../core/utils/http-error';

import { formatearDinero, formatearPeriodo } from '../../../core/utils/formato';

import { Paginacion } from '../../../shared/components/paginacion/paginacion';

import { GestionMes } from './gestion-mes/gestion-mes';

const REGISTROS_POR_PAGINA = 25;

/**
 * Mes actual en Bogotá (UTC-5, sin horario de verano): "2026-10".
 */
function periodoActual(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

/**
 * Historial mensual de vehículos retirados.
 * El mes y la página viven en la URL: /admin/historial?periodo=2026-10&pagina=2
 */
@Component({
  selector: 'app-historial',

  standalone: true,

  imports: [DatePipe, Paginacion, GestionMes],

  templateUrl: './historial.html',
})
export class Historial implements OnInit {
  private readonly adminService = inject(AdminService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  readonly meses = signal<MesHistorial[]>([]);

  readonly cargandoMeses = signal(true);

  readonly errorMeses = signal('');

  readonly periodo = signal('');

  readonly historial = signal<HistorialMesResponse | null>(null);

  readonly cargando = signal(false);

  readonly mensajeError = signal('');

  readonly formatearDinero = formatearDinero;

  readonly formatearPeriodo = formatearPeriodo;

  /**
   * Fuerza recargar la tabla sin cambiar la URL.
   */
  private readonly recarga = new BehaviorSubject<void>(undefined);

  constructor() {
    /**
     * Cada cambio de query params recarga la tabla.
     * switchMap descarta la respuesta anterior si se cambia rápido de mes.
     */
    combineLatest([this.route.queryParamMap, this.recarga])
      .pipe(
        map(([parametros]) => ({
          periodo: parametros.get('periodo') ?? '',
          pagina: Math.max(1, Number(parametros.get('pagina')) || 1),
        })),

        tap(({ periodo }) => {
          this.periodo.set(periodo);

          this.mensajeError.set('');
        }),

        switchMap(({ periodo, pagina }) => {
          if (!periodo) {
            this.historial.set(null);

            return of(null);
          }

          this.cargando.set(true);

          return this.adminService
            .obtenerHistorialMes(periodo, pagina, REGISTROS_POR_PAGINA)
            .pipe(
              catchError((error) => {
                this.historial.set(null);

                this.mensajeError.set(
                  obtenerMensajeError(
                    error,
                    'No fue posible consultar el historial.',
                  ),
                );

                return of(null);
              }),

              finalize(() => {
                this.cargando.set(false);
              }),
            );
        }),

        takeUntilDestroyed(),
      )
      .subscribe((respuesta) => {
        if (respuesta) {
          this.historial.set(respuesta);
        }
      });
  }

  ngOnInit(): void {
    this.cargarMeses();
  }

  cargarMeses(): void {
    this.cargandoMeses.set(true);

    this.errorMeses.set('');

    this.adminService
      .obtenerMesesHistorial()
      .pipe(
        finalize(() => {
          this.cargandoMeses.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.meses.set(respuesta.meses ?? []);

          /**
           * Sin mes en la URL: se abre el más reciente con datos
           * (o el actual si todavía no hay ninguno).
           */
          if (!this.periodo()) {
            this.navegar(
              {
                periodo: this.meses()[0]?.periodo ?? periodoActual(),
              },
              true,
            );
          }
        },

        error: (error) => {
          this.errorMeses.set(
            obtenerMensajeError(error, 'No fue posible cargar los meses.'),
          );
        },
      });
  }

  /**
   * Recarga meses y tabla (p. ej. después de eliminar un mes).
   */
  recargarTodo(): void {
    this.cargarMeses();

    this.recarga.next();
  }

  seleccionarPeriodo(periodo: string): void {
    if (periodo && periodo !== this.periodo()) {
      this.navegar({ periodo, pagina: 1 });
    }
  }

  cambiarPagina(pagina: number): void {
    this.navegar({ pagina });
  }

  tipoMostrado(registro: RegistroHistorial): string {
    return registro.tipoVehiculoPersonalizado || registro.tipoVehiculoNombre;
  }

  /**
   * El mes elegido puede no estar en la lista (mes sin retirados).
   */
  periodoEnLista(): boolean {
    return this.meses().some((mes) => mes.periodo === this.periodo());
  }

  private navegar(
    parametros: Record<string, string | number | null>,
    reemplazar = false,
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: parametros,
      queryParamsHandling: 'merge',
      replaceUrl: reemplazar,
    });
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DatePipe } from '@angular/common';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { ActivatedRoute, ParamMap, Router } from '@angular/router';

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

import { HistorialService } from '../../../core/services/historial.service';

import { TiposVehiculoService } from '../../../core/services/tipos-vehiculo.service';

import {
  EstadoRegistro,
  FiltrosHistorial,
  HistorialResponse,
  MesHistorial,
  TipoVehiculoAdmin,
} from '../../../core/models/admin.model';

import {
  obtenerErroresDeCampo,
  obtenerMensajeError,
} from '../../../core/utils/http-error';

import { formatearDinero, formatearPeriodo } from '../../../core/utils/formato';

import { normalizarPlaca } from '../../../core/validators/parqueadero.validators';

import { Paginacion } from '../../../shared/components/paginacion/paginacion';

import { GestionMes } from './gestion-mes/gestion-mes';

const REGISTROS_POR_PAGINA = 25;

const ESTADOS: EstadoRegistro[] = ['dentro', 'retirado', 'anulado'];

const ETIQUETA_ESTADO: Record<EstadoRegistro, string> = {
  dentro: 'Dentro',
  retirado: 'Retirado',
  anulado: 'Anulado',
};

const CLASE_ESTADO: Record<EstadoRegistro, string> = {
  dentro: 'bg-sky-100 text-sky-800',
  retirado: 'bg-emerald-100 text-emerald-800',
  anulado: 'bg-red-100 text-red-700',
};

type ModoFecha = 'mes' | 'rango';

/**
 * Mes actual en Bogotá (UTC-5, sin horario de verano): "2026-10".
 */
function periodoActual(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

/**
 * Convierte los query params en filtros para la API.
 */
function leerFiltros(parametros: ParamMap): FiltrosHistorial {
  const estado = parametros.get('estado') as EstadoRegistro | null;

  return {
    mes: parametros.get('mes') ?? undefined,
    desde: parametros.get('desde') ?? undefined,
    hasta: parametros.get('hasta') ?? undefined,
    placa: parametros.get('placa') ?? undefined,
    tipoVehiculoId: parametros.get('tipoVehiculoId') ?? undefined,
    estado: estado && ESTADOS.includes(estado) ? estado : undefined,
    page: Math.max(1, Number(parametros.get('page')) || 1),
    limit: REGISTROS_POR_PAGINA,
  };
}

/**
 * Historial con filtros. Todos los filtros y la página viven en la URL:
 * /admin/historial?mes=2026-10&estado=retirado&page=2
 */
@Component({
  selector: 'app-historial',

  standalone: true,

  imports: [DatePipe, ReactiveFormsModule, Paginacion, GestionMes],

  templateUrl: './historial.html',
})
export class Historial implements OnInit {
  private readonly historialService = inject(HistorialService);

  private readonly tiposVehiculoService = inject(TiposVehiculoService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);

  readonly estados = ESTADOS;

  readonly meses = signal<MesHistorial[]>([]);

  readonly tipos = signal<TipoVehiculoAdmin[]>([]);

  readonly cargandoMeses = signal(true);

  readonly filtros = signal<FiltrosHistorial | null>(null);

  readonly historial = signal<HistorialResponse | null>(null);

  readonly cargando = signal(false);

  readonly mensajeError = signal('');

  /**
   * Errores por filtro devueltos por el servidor (400).
   */
  readonly erroresFiltros = signal<Record<string, string>>({});

  readonly errorRango = signal('');

  readonly formatearDinero = formatearDinero;

  readonly formatearPeriodo = formatearPeriodo;

  readonly formulario = this.fb.nonNullable.group({
    modo: this.fb.nonNullable.control<ModoFecha>('mes'),
    mes: [''],
    desde: [''],
    hasta: [''],
    placa: [''],
    tipoVehiculoId: [''],
    estado: [''],
  });

  readonly modo = signal<ModoFecha>('mes');

  /**
   * La gestión (descargar/eliminar) aplica a un mes concreto.
   */
  readonly mesSeleccionado = computed(() => this.filtros()?.mes ?? '');

  /**
   * Fuerza recargar la tabla sin cambiar la URL.
   */
  private readonly recarga = new BehaviorSubject<void>(undefined);

  constructor() {
    combineLatest([this.route.queryParamMap, this.recarga])
      .pipe(
        map(([parametros]) => leerFiltros(parametros)),

        tap((filtros) => {
          this.filtros.set(filtros);

          this.sincronizarFormulario(filtros);

          this.mensajeError.set('');

          this.erroresFiltros.set({});
        }),

        /**
         * switchMap descarta la respuesta anterior si se cambian
         * los filtros rápido.
         */
        switchMap((filtros) => {
          this.cargando.set(true);

          return this.historialService.obtenerHistorial(filtros).pipe(
            catchError((error) => {
              this.historial.set(null);

              this.erroresFiltros.set(obtenerErroresDeCampo(error));

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

    this.cargarTipos();
  }

  cargarMeses(): void {
    this.cargandoMeses.set(true);

    this.historialService
      .obtenerMeses()
      .pipe(
        finalize(() => {
          this.cargandoMeses.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.meses.set(respuesta.meses ?? []);

          /**
           * Sin filtros en la URL: se abre el mes más reciente con datos
           * (o el actual si todavía no hay ninguno).
           */
          if (this.route.snapshot.queryParamMap.keys.length === 0) {
            this.navegar(
              { mes: this.meses()[0]?.periodo ?? periodoActual() },
              true,
            );
          }
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible cargar los meses.'),
          );
        },
      });
  }

  private cargarTipos(): void {
    this.tiposVehiculoService.obtenerTodos().subscribe({
      next: (respuesta) => {
        this.tipos.set(respuesta.tipos ?? []);
      },

      /**
       * Sin tipos el filtro sigue funcionando con "Todos".
       */
      error: () => {
        this.tipos.set([]);
      },
    });
  }

  cambiarModo(modo: ModoFecha): void {
    this.modo.set(modo);

    this.formulario.controls.modo.setValue(modo);

    this.errorRango.set('');
  }

  convertirPlacaMayusculas(): void {
    const control = this.formulario.controls.placa;

    control.setValue(control.value.toUpperCase(), { emitEvent: false });
  }

  aplicarFiltros(): void {
    if (this.cargando()) {
      return;
    }

    const valores = this.formulario.getRawValue();

    this.errorRango.set('');

    if (
      valores.modo === 'rango' &&
      valores.desde &&
      valores.hasta &&
      valores.desde > valores.hasta
    ) {
      this.errorRango.set('La fecha desde no puede ser posterior a hasta.');

      return;
    }

    const esMes = valores.modo === 'mes';

    this.navegar({
      mes: esMes ? valores.mes || null : null,
      desde: esMes ? null : valores.desde || null,
      hasta: esMes ? null : valores.hasta || null,
      placa: normalizarPlaca(valores.placa.trim()) || null,
      tipoVehiculoId: valores.tipoVehiculoId || null,
      estado: valores.estado || null,
    });
  }

  limpiarFiltros(): void {
    if (this.cargando()) {
      return;
    }

    this.errorRango.set('');

    this.navegar({
      mes: this.meses()[0]?.periodo ?? periodoActual(),
    });
  }

  /**
   * Recarga meses y tabla (p. ej. después de eliminar un mes).
   */
  recargarTodo(): void {
    this.cargarMeses();

    this.recarga.next();
  }

  cambiarPagina(pagina: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: pagina > 1 ? pagina : null },
      queryParamsHandling: 'merge',
    });
  }

  etiquetaEstado(estado: EstadoRegistro): string {
    return ETIQUETA_ESTADO[estado];
  }

  claseEstado(estado: EstadoRegistro): string {
    return CLASE_ESTADO[estado];
  }

  /**
   * El mes elegido puede no estar en la lista (mes sin registros).
   */
  mesEnLista(periodo: string): boolean {
    return this.meses().some((mes) => mes.periodo === periodo);
  }

  private sincronizarFormulario(filtros: FiltrosHistorial): void {
    const modo: ModoFecha = filtros.desde || filtros.hasta ? 'rango' : 'mes';

    this.modo.set(modo);

    this.formulario.reset(
      {
        modo,
        mes: filtros.mes ?? '',
        desde: filtros.desde ?? '',
        hasta: filtros.hasta ?? '',
        placa: filtros.placa ?? '',
        tipoVehiculoId: filtros.tipoVehiculoId ?? '',
        estado: filtros.estado ?? '',
      },
      { emitEvent: false },
    );
  }

  /**
   * Reemplaza todos los filtros de la URL; los vacíos no se incluyen
   * y la página vuelve a 1.
   */
  private navegar(
    parametros: Record<string, string | null>,
    reemplazar = false,
  ): void {
    const queryParams: Record<string, string> = {};

    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor) {
        queryParams[clave] = valor;
      }
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: reemplazar,
    });
  }
}

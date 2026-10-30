import { Component, OnInit, signal } from '@angular/core';

import { DatePipe } from '@angular/common';

import { RouterLink } from '@angular/router';

import { finalize } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';

import {
  ResumenAdminResponse,
  TipoMovimiento,
} from '../../../core/models/admin.model';

import { obtenerMensajeError } from '../../../core/utils/http-error';

import { formatearDinero, formatearPeriodo } from '../../../core/utils/formato';

const ETIQUETA_MOVIMIENTO: Record<TipoMovimiento, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  anulacion: 'Anulación',
};

const CLASE_MOVIMIENTO: Record<TipoMovimiento, string> = {
  entrada: 'bg-slate-100 text-slate-700',
  salida: 'bg-emerald-100 text-emerald-800',
  anulacion: 'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-dashboard-admin',

  standalone: true,

  imports: [DatePipe, RouterLink],

  templateUrl: './dashboard-admin.html',

  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit {
  readonly cargando = signal(true);

  readonly mensajeError = signal('');

  readonly resumen = signal<ResumenAdminResponse | null>(null);

  readonly formatearDinero = formatearDinero;

  readonly formatearPeriodo = formatearPeriodo;

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.cargando.set(true);

    this.mensajeError.set('');

    this.adminService
      .obtenerResumenAdmin()
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.resumen.set(respuesta);
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(
              error,
              'No fue posible cargar el resumen del administrador.',
            ),
          );
        },
      });
  }

  etiquetaMovimiento(movimiento: TipoMovimiento): string {
    return ETIQUETA_MOVIMIENTO[movimiento];
  }

  claseMovimiento(movimiento: TipoMovimiento): string {
    return CLASE_MOVIMIENTO[movimiento];
  }
}

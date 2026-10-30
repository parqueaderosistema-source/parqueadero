import { Component, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { obtenerMensajeError } from '../../../core/utils/http-error';

@Component({
  selector: 'app-dashboard-trabajador',

  standalone: true,

  imports: [RouterLink],

  templateUrl: './dashboard-trabajador.html',

  styleUrl: './dashboard-trabajador.css',
})
export class DashboardTrabajador implements OnInit {
  readonly cargando = signal(true);

  readonly mensajeError = signal('');

  readonly vehiculosDentro = signal(0);

  readonly entradasHoy = signal(0);

  readonly salidasHoy = signal(0);

  readonly recaudoHoy = signal(0);

  constructor(private readonly parqueaderoService: ParqueaderoService) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.cargando.set(true);

    this.mensajeError.set('');

    this.parqueaderoService
      .obtenerResumenHoy()
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.vehiculosDentro.set(respuesta.vehiculosDentro);

          this.entradasHoy.set(respuesta.entradasHoy);

          this.salidasHoy.set(respuesta.salidasHoy);

          this.recaudoHoy.set(respuesta.recaudoHoy);
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible cargar el resumen.'),
          );
        },
      });
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }
}

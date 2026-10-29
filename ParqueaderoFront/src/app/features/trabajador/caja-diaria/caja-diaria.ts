import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { RegistroParqueadero } from '../../../core/models/parqueadero.model';

@Component({
  selector: 'app-caja-diaria',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './caja-diaria.html',

  styleUrl: './caja-diaria.css',
})
export class CajaDiaria implements OnInit {
  readonly cargando = signal(true);

  readonly mensajeError = signal('');

  readonly fecha = signal('');

  readonly registros = signal<RegistroParqueadero[]>([]);

  constructor(private readonly parqueaderoService: ParqueaderoService) {}

  ngOnInit(): void {
    this.cargarCaja();
  }

  cargarCaja(): void {
    this.cargando.set(true);

    this.mensajeError.set('');

    this.parqueaderoService
      .obtenerRecaudoHoy()
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          const registrosRecibidos = respuesta.registros ?? [];

          this.fecha.set(respuesta.fecha ?? '');

          this.registros.set(registrosRecibidos);

          console.log('Registros caja:', registrosRecibidos);

          console.log('Cantidad:', registrosRecibidos.length);

          console.log('Total calculado:', this.calcularTotalRecaudado());
        },

        error: (error) => {
          console.error('Error cargando caja:', error);

          this.mensajeError.set(
            error?.error?.message ?? 'No fue posible cargar la caja diaria.',
          );
        },
      });
  }

  /**
   * Calcula directamente la suma de los
   * registros que aparecen en la tabla.
   */
  calcularTotalRecaudado(): number {
    return this.registros().reduce(
      (acumulado, registro) => {
        const valor = Number(registro.valorCobrado ?? 0);

        return acumulado + valor;
      },

      0,
    );
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor);
  }
}

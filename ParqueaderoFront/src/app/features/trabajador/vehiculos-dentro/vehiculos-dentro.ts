import { Component, OnInit, computed, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { RegistroParqueadero } from '../../../core/models/parqueadero.model';

import { obtenerMensajeError } from '../../../core/utils/http-error';

import { normalizarPlaca } from '../../../core/validators/parqueadero.validators';

import {
  HORAS_LIMITE_PERMANENCIA,
  formatearPermanencia,
  superaLimitePermanencia,
} from '../../../core/utils/tiempo';

@Component({
  selector: 'app-vehiculos-dentro',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './vehiculos-dentro.html',

  styleUrl: './vehiculos-dentro.css',
})
export class VehiculosDentro implements OnInit {
  readonly cargando = signal(true);

  readonly mensajeError = signal('');

  readonly registros = signal<RegistroParqueadero[]>([]);

  readonly busqueda = signal('');

  readonly horasLimite = HORAS_LIMITE_PERMANENCIA;

  readonly totalPorRevisar = computed(
    () =>
      this.registros().filter((registro) =>
        superaLimitePermanencia(registro.fechaHoraEntrada),
      ).length,
  );

  readonly registrosFiltrados = computed(() => {
    const texto = normalizarPlaca(this.busqueda().trim());

    if (!texto) {
      return this.registros();
    }

    return this.registros().filter((registro) =>
      registro.placa.toUpperCase().includes(texto),
    );
  });

  constructor(private readonly parqueaderoService: ParqueaderoService) {}

  ngOnInit(): void {
    this.cargarVehiculos();
  }

  cargarVehiculos(): void {
    this.cargando.set(true);

    this.mensajeError.set('');

    this.parqueaderoService
      .obtenerVehiculosDentro()
      .pipe(
        finalize(() => {
          this.cargando.set(false);
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.registros.set(respuesta.registros ?? []);
        },

        error: (error) => {
          this.mensajeError.set(
            obtenerMensajeError(error, 'No fue posible cargar los vehículos.'),
          );
        },
      });
  }

  actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor.toUpperCase());
  }

  calcularPermanencia(fechaEntrada: string): string {
    return formatearPermanencia(fechaEntrada);
  }

  requiereRevision(fechaEntrada: string): boolean {
    return superaLimitePermanencia(fechaEntrada);
  }
}

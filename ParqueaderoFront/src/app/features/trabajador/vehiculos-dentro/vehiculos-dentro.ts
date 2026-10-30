import { Component, OnInit, computed, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';

import { ParqueaderoService } from '../../../core/services/parqueadero.service';

import { RegistroParqueadero } from '../../../core/models/parqueadero.model';

import { obtenerMensajeError } from '../../../core/utils/http-error';

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

  readonly registrosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toUpperCase();

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
    const entrada = new Date(fechaEntrada);

    const ahora = new Date();

    const diferencia = Math.max(0, ahora.getTime() - entrada.getTime());

    const minutosTotales = Math.floor(diferencia / 60000);

    const dias = Math.floor(minutosTotales / 1440);

    const horas = Math.floor((minutosTotales % 1440) / 60);

    const minutos = minutosTotales % 60;

    const partes: string[] = [];

    if (dias > 0) {
      partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
    }

    if (horas > 0) {
      partes.push(`${horas} h`);
    }

    partes.push(`${minutos} min`);

    return partes.join(' ');
  }
}

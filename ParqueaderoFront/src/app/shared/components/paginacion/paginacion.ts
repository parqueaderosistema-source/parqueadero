import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-paginacion',

  standalone: true,

  template: `
    @if (totalPaginas() > 1) {
      <nav
        class="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:px-6"
        aria-label="Paginación"
      >
        <button
          type="button"
          (click)="cambiar.emit(pagina() - 1)"
          [disabled]="deshabilitado() || pagina() <= 1"
          class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Anterior
        </button>

        <p class="text-sm text-slate-500">
          Página
          <span class="font-semibold text-slate-900">{{ pagina() }}</span>
          de
          <span class="font-semibold text-slate-900">{{ totalPaginas() }}</span>
        </p>

        <button
          type="button"
          (click)="cambiar.emit(pagina() + 1)"
          [disabled]="deshabilitado() || pagina() >= totalPaginas()"
          class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente →
        </button>
      </nav>
    }
  `,
})
export class Paginacion {
  readonly pagina = input.required<number>();

  readonly totalPaginas = input.required<number>();

  readonly deshabilitado = input(false);

  readonly cambiar = output<number>();
}

import { Injectable, signal } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, catchError, map, of, tap } from 'rxjs';

import {
  LoginResponse,
  SessionResponse,
  Usuario,
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  private readonly usuarioSignal = signal<Usuario | null>(null);

  readonly usuario = this.usuarioSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  login(correo: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, {
        correo,
        password,
      })
      .pipe(
        tap((respuesta) => {
          this.usuarioSignal.set(respuesta.usuario);
        }),
      );
  }

  comprobarSesion(): Observable<boolean> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/me`).pipe(
      tap((respuesta) => {
        this.usuarioSignal.set(respuesta.usuario);
      }),

      map(() => true),

      catchError(() => {
        this.usuarioSignal.set(null);

        return of(false);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.usuarioSignal.set(null);
      }),
    );
  }

  obtenerUsuario(): Usuario | null {
    return this.usuarioSignal();
  }

  estaAutenticado(): boolean {
    return this.usuarioSignal() !== null;
  }

  /**
   * Olvida la sesión local (p. ej. cuando el servidor responde 401).
   */
  limpiarSesion(): void {
    this.usuarioSignal.set(null);
  }
}

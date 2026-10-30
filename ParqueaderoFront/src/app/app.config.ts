import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';

import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';

import { provideRouter } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';

import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideZonelessChangeDetection(),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([credentialsInterceptor, errorInterceptor]),
    ),

    /**
     * Fechas en hora de Bogotá. El DatePipe no acepta
     * "America/Bogota", pero Colombia no tiene horario
     * de verano, así que el desfase fijo es equivalente.
     */
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: {
        timezone: '-0500',
      },
    },
  ],
};

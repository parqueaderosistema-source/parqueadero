import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * URL base de la API. Los servicios dependen de este token y no de
 * una URL escrita a mano; cambia según el entorno (environments/).
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

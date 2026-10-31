/**
 * Producción (ng build). Ruta relativa: Vercel reenvía /api a Render
 * (ver vercel.json), así la cookie de sesión es del mismo dominio del
 * front y ningún navegador la bloquea como cookie de terceros.
 */
export const environment = {
  apiUrl: '/api',
};

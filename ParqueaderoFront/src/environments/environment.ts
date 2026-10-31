/**
 * Producción (ng build). El front está en Vercel y la API en Render,
 * en dominios distintos: la sesión viaja en una cookie sameSite=none.
 */
export const environment = {
  apiUrl: 'https://parqueadero-79ra.onrender.com/api',
};

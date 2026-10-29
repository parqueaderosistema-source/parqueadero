import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (request, next) => {
  const requestConCredenciales = request.clone({
    withCredentials: true,
  });

  return next(requestConCredenciales);
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  if (token === null)
    return next(req);
  
  const authorizedRequest = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(authorizedRequest);
};
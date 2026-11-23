import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../authentication/auth.service';
import { ErrorService } from './error.service';

export const errorPageGuard: CanActivateFn = () => {
  if (inject(ErrorService).currentError() === null && inject(AuthService).isReady())
    return inject(Router).parseUrl('/');

  return true;
};

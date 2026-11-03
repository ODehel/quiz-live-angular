import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let sessionReady: boolean;

  beforeEach(() => {
    sessionReady = false;
    const fakeAuthService = { isReady: () => sessionReady };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: fakeAuthService }
      ]
    });
  });

  const runGuard = () => TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  it('redirects to the error page when the session is not ready', () => {
    const result = runGuard();

    expect(result).toEqual(TestBed.inject(Router).parseUrl('/error'));
  });

  it('lets the navigation through when the session is ready', () => {
    sessionReady = true;

    const result = runGuard();

    expect(result).toBe(true);
  });
});

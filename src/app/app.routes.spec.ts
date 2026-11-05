import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { ErrorPage } from './shared/ui/error-page/error-page';
import { ErrorService } from './core/error/error.service';
import { AuthService } from './core/authentication/auth.service';
import { stubIconIn } from './shared/ui/icon/icon.test-helpers';

describe('routes', () => {
  let sessionReady: boolean;

  beforeEach(() => {
    sessionReady = true;
    const fakeAuthService = { isReady: () => sessionReady };

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: fakeAuthService }
      ],
    });
    stubIconIn(ErrorPage);
  });

  it('renders the dashboard on /dashboard when the session is ready', async () => {
    const harness = await RouterTestingHarness.create('/dashboard');

    const page = (harness.fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="dashboard"]');
    expect(page).not.toBeNull();
  });

  it('redirects /dashboard to the error page when the session is not ready', async () => {
    sessionReady = false;

    await RouterTestingHarness.create('/dashboard');

    expect(TestBed.inject(Router).url).toBe('/error');
  });

  it('redirects the root to the dashboard when the session is ready', async () => {
    await RouterTestingHarness.create('/');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('redirects the root to the error page when the session is not ready', async () => {
    sessionReady = false;

    await RouterTestingHarness.create('/');

    expect(TestBed.inject(Router).url).toBe('/error');
  });

  it('renders the error page on /error', async () => {
    TestBed.inject(ErrorService).notFound();

    const harness = await RouterTestingHarness.create('/error');

    const page = (harness.fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="error-screen"]');
    expect(page).not.toBeNull();
  });
});

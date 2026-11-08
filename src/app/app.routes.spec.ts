import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { ErrorPage } from './shared/ui/error-page/error-page';
import { ErrorService } from './core/error/error.service';
import { AuthService } from './core/authentication/auth.service';
import { stubIconIn } from './shared/ui/icon/icon.test-helpers';
import { ThemeService } from './features/themes/theme.service';
import { of } from 'rxjs';

describe('routes', () => {
  let sessionReady: boolean;

  beforeEach(() => {
    sessionReady = true;
    const fakeAuthService = { isReady: () => sessionReady };

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: fakeAuthService },
        { provide: ThemeService, useValue: { list: () => of({ themes: [], total: 0 }) } }
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

  it('renders the themes page on /themes when the session is ready', async () => {
    const harness = await RouterTestingHarness.create('/themes');

    const page = (harness.fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="themes-title"]');
    expect(page).not.toBeNull();
  });

  it('redirects /themes to the error page when the session is not ready', async () => {
    sessionReady = false;

    await RouterTestingHarness.create('/themes');

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

  it('keeps the error page readable after returning home when the session is not ready', async () => {
    sessionReady = false;
    TestBed.inject(ErrorService).connectionLost();
    const harness = await RouterTestingHarness.create('/error');
    const homeButton = (harness.fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="home-button"]') as HTMLButtonElement;

    homeButton.click();
    await harness.fixture.whenStable();

    const page = (harness.fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="error-screen"]');
    expect(TestBed.inject(Router).url).toBe('/error');
    expect(page).not.toBeNull();
  });
});

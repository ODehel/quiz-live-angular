import { TestBed } from '@angular/core/testing';
import { NavigationError, Router, provideRouter, withRouterConfig } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { ErrorPage } from './shared/ui/error-page/error-page';
import { ErrorService } from './core/error/error.service';
import { AuthService } from './core/authentication/auth.service';
import { stubIconIn } from './shared/ui/icon/icon.test-helpers';
import { ThemeService } from './features/themes/theme.service';
import { QuestionService } from './features/questions/question.service';
import { ThemeList } from './features/themes/theme-list';
import { GameStateService } from './core/game-state/game-state.service';
import { WebSocketService } from './core/websocket/websocket.service';
import { SERVER_ADDRESS } from './core/websocket/websocket.providers';
import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { fullSync } from './core/game-state/game-state.test-helpers';

describe('routes', () => {
  let sessionReady: boolean;
  let hubMessages: Subject<string>;
  let disconnected: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    sessionReady = true;
    hubMessages = new Subject<string>();
    disconnected = signal(false);
    const fakeAuthService = { isReady: () => sessionReady };

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: fakeAuthService },
        { provide: GameStateService, useFactory: () => new GameStateService({ messages$: hubMessages, send: () => {} }) },
        {
          provide: WebSocketService,
          useValue: {
            isConnected: signal(true).asReadonly(),
            isReconnecting: signal(false).asReadonly(),
            isDisconnected: disconnected.asReadonly(),
          },
        },
        { provide: SERVER_ADDRESS, useValue: 'localhost:3000' },
        { provide: ThemeService, useValue: { list: () => of({ themes: [], total: 0 }) } },
        { provide: QuestionService, useValue: { count: () => of(0) } }
      ],
    });
    stubIconIn(ErrorPage);
    stubIconIn(ThemeList);
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

  it('renders the themes page on /content/themes when the session is ready', async () => {
    const harness = await RouterTestingHarness.create('/content/themes');

    const page = (harness.fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="themes-title"]');
    expect(page).not.toBeNull();
  });

  it('redirects /content/themes to the error page when the session is not ready', async () => {
    sessionReady = false;

    await RouterTestingHarness.create('/content/themes');

    expect(TestBed.inject(Router).url).toBe('/error');
  });

  it('no longer serves the themes page on /themes', async () => {
    await expect(RouterTestingHarness.create('/themes')).rejects.toThrow();
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

  it('redirects /error to the dashboard when no error is set and the session is ready', async () => {
    await RouterTestingHarness.create('/error');

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('stays on /error without redirecting when no error is set and the session is not ready', async () => {
    sessionReady = false;

    await RouterTestingHarness.create('/error');

    expect(TestBed.inject(Router).url).toBe('/error');
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

  describe('the top bar', () => {
    const topBarIn = (harness: RouterTestingHarness) =>
      (harness.fixture.nativeElement as HTMLElement).querySelector('[data-testid="top-bar"]');

    it('is shown on /dashboard', async () => {
      const harness = await RouterTestingHarness.create('/dashboard');

      expect(topBarIn(harness)).not.toBeNull();
    });

    it('is shown on /content/themes', async () => {
      const harness = await RouterTestingHarness.create('/content/themes');

      expect(topBarIn(harness)).not.toBeNull();
    });

    it('is shown only once on a protected page', async () => {
      const harness = await RouterTestingHarness.create('/dashboard');

      const bars = (harness.fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="top-bar"]');
      expect(bars.length).toBe(1);
    });

    it('stays when navigating from /dashboard to /content/themes', async () => {
      const harness = await RouterTestingHarness.create('/dashboard');

      await harness.navigateByUrl('/content/themes');

      expect(topBarIn(harness)).not.toBeNull();
      expect((harness.fixture.nativeElement as HTMLElement).querySelector('[data-testid="themes-title"]'))
        .not.toBeNull();
    });

    it('is not shown on /error', async () => {
      TestBed.inject(ErrorService).notFound();

      const harness = await RouterTestingHarness.create('/error');

      expect(topBarIn(harness)).toBeNull();
    });

    it('is not shown when /dashboard redirects to the error page', async () => {
      sessionReady = false;

      const harness = await RouterTestingHarness.create('/dashboard');

      expect(topBarIn(harness)).toBeNull();
    });

    it('is not shown on /playground', async () => {
      const harness = await RouterTestingHarness.create('/playground');

      expect((harness.fixture.nativeElement as HTMLElement).querySelector('app-playground')).not.toBeNull();
      expect(topBarIn(harness)).toBeNull();
    });
  });

  describe('the sidebar', () => {
    const sidebarIn = (harness: RouterTestingHarness) =>
      (harness.fixture.nativeElement as HTMLElement).querySelector('[data-testid="sidebar"]');

    it('is shown on /dashboard', async () => {
      const harness = await RouterTestingHarness.create('/dashboard');

      expect(sidebarIn(harness)).not.toBeNull();
    });

    it('is shown on /content/themes', async () => {
      const harness = await RouterTestingHarness.create('/content/themes');

      expect(sidebarIn(harness)).not.toBeNull();
    });

    it('is shown only once on a protected page', async () => {
      const harness = await RouterTestingHarness.create('/dashboard');

      const sidebars = (harness.fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="sidebar"]');
      expect(sidebars.length).toBe(1);
    });

    it('stays, with the highlight following the route, when navigating from /dashboard to /content/themes', async () => {
      const harness = await RouterTestingHarness.create('/dashboard');

      await harness.navigateByUrl('/content/themes');

      const root = harness.fixture.nativeElement as HTMLElement;
      expect(sidebarIn(harness)).not.toBeNull();
      expect(root.querySelector('[data-testid="nav-themes"]')?.getAttribute('aria-current')).toBe('page');
      expect(root.querySelector('[data-testid="nav-dashboard"]')?.hasAttribute('aria-current')).toBe(false);
    });

    it('is not shown on /error', async () => {
      TestBed.inject(ErrorService).notFound();

      const harness = await RouterTestingHarness.create('/error');

      expect(sidebarIn(harness)).toBeNull();
    });

    it('is not shown when /dashboard redirects to the error page', async () => {
      sessionReady = false;

      const harness = await RouterTestingHarness.create('/dashboard');

      expect(sidebarIn(harness)).toBeNull();
    });

    it('is not shown on /playground', async () => {
      const harness = await RouterTestingHarness.create('/playground');

      expect((harness.fixture.nativeElement as HTMLElement).querySelector('app-playground')).not.toBeNull();
      expect(sidebarIn(harness)).toBeNull();
    });
  });

  describe('the content pages while a game is in progress', () => {
    // /pilot/lobby et /pilot/play n'existent pas encore : la navigation de redirection échoue (décision #114).
    // La promesse se résout au lieu de rejeter, et `failedNavigations` garde l'adresse tentée.
    let failedNavigations: string[];

    beforeEach(() => {
      failedNavigations = [];
      TestBed.configureTestingModule({
        providers: [provideRouter(routes, withRouterConfig({ resolveNavigationPromiseOnError: true }))]
      });
      TestBed.inject(Router).events.subscribe(event => {
        if (event instanceof NavigationError) failedNavigations.push(event.url);
      });
    });

    const gameIsAt = (status: string) => {
      TestBed.inject(GameStateService);
      hubMessages.next(JSON.stringify(fullSync({ status })));
    };

    it('sends /content/themes to the lobby when the game is pending', async () => {
      gameIsAt('PENDING');

      await RouterTestingHarness.create('/content/themes');

      expect(failedNavigations).toEqual(['/pilot/lobby']);
    });

    it('sends /content/themes to the play page when the game is open', async () => {
      gameIsAt('OPEN');

      await RouterTestingHarness.create('/content/themes');

      expect(failedNavigations).toEqual(['/pilot/play']);
    });

    it('serves /content/themes when the application is disconnected, whatever the game', async () => {
      gameIsAt('OPEN');
      disconnected.set(true);

      const harness = await RouterTestingHarness.create('/content/themes');

      expect((harness.fixture.nativeElement as HTMLElement).querySelector('[data-testid="themes-title"]'))
        .not.toBeNull();
    });

    it('serves /content/themes when the game is completed', async () => {
      gameIsAt('COMPLETED');

      const harness = await RouterTestingHarness.create('/content/themes');

      expect((harness.fixture.nativeElement as HTMLElement).querySelector('[data-testid="themes-title"]'))
        .not.toBeNull();
    });

    it('still serves /dashboard', async () => {
      gameIsAt('OPEN');

      const harness = await RouterTestingHarness.create('/dashboard');

      expect((harness.fixture.nativeElement as HTMLElement).querySelector('[data-testid="dashboard"]'))
        .not.toBeNull();
    });
  });
});

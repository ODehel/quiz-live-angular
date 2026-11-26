import { ApplicationInitStatus, ApplicationRef } from '@angular/core';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { ErrorService } from './core/error/error.service';
import { ErrorPage } from './shared/ui/error-page/error-page';
import { ThemeList } from './features/themes/theme-list';
import { QuestionList } from './features/questions/question-list';
import { InertSocket } from './core/websocket/websocket.test-helpers';
import { SERVER_ADDRESS, WEB_SOCKET_CONSTRUCTOR } from './core/websocket/websocket.providers';
import { serverAddress } from './core/websocket/server-address';
import { environment } from '../environments/environment';

describe('appConfig', () => {
  let initStatus: ApplicationInitStatus;
  let httpMock: HttpTestingController;

  const startApplication = () => {
    initStatus = TestBed.inject(ApplicationInitStatus);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: WEB_SOCKET_CONSTRUCTOR, useValue: InertSocket },
      ],
    });
  });

  it('holds the application start until the token request is answered', async () => {
    startApplication();
    const req = httpMock.expectOne('/api/v1/token');
    expect(initStatus.done).toBe(false);

    req.flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    expect(initStatus.done).toBe(true);
  });

  it('attaches the session token to the requests made once started', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    TestBed.inject(HttpClient).get('/some-url').subscribe();

    const req = httpMock.expectOne('/some-url');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt');
    req.flush(null);
  });

  it('sends the token request itself without an Authorization header', () => {
    startApplication();
    const req = httpMock.expectOne('/api/v1/token');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('lets the application start when the token request fails', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await initStatus.donePromise;

    expect(initStatus.done).toBe(true);
    expect(TestBed.inject(ErrorService).currentError()).toEqual({ variant: 'invalid-credentials' });
  });

  it('lets the application start when the server never answers', async () => {
    vi.useFakeTimers();
    try {
      startApplication();
      httpMock.expectOne('/api/v1/token');
      await vi.advanceTimersByTimeAsync(10_000);
      await initStatus.donePromise;

      expect(initStatus.done).toBe(true);
      expect(TestBed.inject(ErrorService).currentError()).toEqual({ variant: 'connection-lost' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('navigates to the error page when the token request fails', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await initStatus.donePromise;
    await TestBed.inject(ApplicationRef).whenStable();

    expect(TestBed.inject(Router).url).toBe('/error');
  });

  it('navigates to the error page when the server never answers', async () => {
    vi.useFakeTimers();
    try {
      startApplication();
      httpMock.expectOne('/api/v1/token');
      await vi.advanceTimersByTimeAsync(10_000);
      await initStatus.donePromise;
      await vi.runAllTimersAsync();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(TestBed.inject(Router).url).toBe('/error');
    } finally {
      vi.useRealTimers();
    }
  });

  it('draws the home icon on the error page button', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await initStatus.donePromise;

    const fixture = TestBed.createComponent(ErrorPage);
    await fixture.whenStable();

    const homeButton = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="home-button"]');
    expect(homeButton?.querySelector('svg')).not.toBeNull();
  });

  it('draws the icon of the session replaced error', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;
    TestBed.inject(ErrorService).sessionReplaced();

    const fixture = TestBed.createComponent(ErrorPage);
    await fixture.whenStable();

    const mainIcon = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="main-icon"]');
    expect(mainIcon?.querySelector('svg')).not.toBeNull();
  });

  it('draws the refresh icon on the error page button when the session was replaced', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;
    TestBed.inject(ErrorService).sessionReplaced();

    const fixture = TestBed.createComponent(ErrorPage);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="home-button"]');
    expect(button?.querySelector('svg')).not.toBeNull();
  });

  it('draws the generic icon on the theme cards', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    const fixture = TestBed.createComponent(ThemeList);
    httpMock.expectOne('/api/v1/themes?page=1&limit=100').flush({
      data: [{ id: 'theme-1', name: 'Géographie', created_at: '2026-10-14T09:00:00.000Z', last_updated_at: null }],
      page: 1,
      limit: 100,
      total: 1,
      total_pages: 1,
    });
    await fixture.whenStable();

    const card = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="theme-card"]');
    expect(card?.querySelector('svg')).not.toBeNull();
  });

  it('draws the type, duration and media icons on the question cards', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    const fixture = TestBed.createComponent(QuestionList);
    const question = { theme_id: 'theme-1', level: 3, time_limit: 30, points: 200, image_path: '/uploads/a.jpg', audio_path: '/uploads/a.mp3' };
    httpMock.expectOne('/api/v1/questions?page=1&limit=20').flush({
      data: [
        { ...question, id: 'question-1', title: 'Première', type: 'MCQ' },
        { ...question, id: 'question-2', title: 'Seconde', type: 'SPEED' },
      ],
      page: 1,
      limit: 20,
      total: 2,
      total_pages: 1,
    });
    httpMock.expectOne('/api/v1/themes?page=1&limit=100').flush({ data: [], page: 1, limit: 100, total: 0, total_pages: 0 });
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const iconsOf = (testId: string) => Array.from(root.querySelectorAll(`[data-testid="${testId}"]`))
      .map(element => element.querySelector('svg') instanceof SVGElement);
    expect(iconsOf('question-type')).toEqual([true, true]);
    expect(iconsOf('question-duration')).toEqual([true, true]);
    expect(iconsOf('question-image')).toEqual([true, true]);
    expect(iconsOf('question-audio')).toEqual([true, true]);
  });

  it('draws the plus icon on the new theme button and the cross in its dialog', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    const fixture = TestBed.createComponent(ThemeList);
    httpMock.expectOne('/api/v1/themes?page=1&limit=100').flush({ data: [], page: 1, limit: 100, total: 0, total_pages: 0 });
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="new-theme"]');
    button?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const cross = document.querySelector('.cdk-dialog-container [data-testid="close"]');
    expect(button?.querySelector('svg')).toBeInstanceOf(SVGElement);
    expect(cross?.querySelector('svg')).toBeInstanceOf(SVGElement);
  });

  it('does not navigate when the token request succeeds', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;
    await TestBed.inject(ApplicationRef).whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('provides the server address as the host and port of the configured wsUrl', () => {
    const address = TestBed.inject(SERVER_ADDRESS);

    expect(address).toBe(serverAddress(environment.wsUrl));
    expect(address).not.toBe(environment.wsUrl);
  });
});

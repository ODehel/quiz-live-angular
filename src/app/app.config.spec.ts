import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { ErrorService } from './core/error/error.service';

describe('appConfig', () => {
  let initStatus: ApplicationInitStatus;
  let httpMock: HttpTestingController;

  const startApplication = () => {
    initStatus = TestBed.inject(ApplicationInitStatus);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
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
});

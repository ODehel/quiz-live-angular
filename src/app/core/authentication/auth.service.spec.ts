import { TestBed } from "@angular/core/testing";
import { AuthService } from "./auth.service";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import { Mock } from "vitest";
import { ErrorService } from "../error/error.service";
import { TokenProvider } from "../websocket/websocket.service";

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let fakeErrorService: { invalidCredentials: Mock; connectionLost: Mock };

  beforeEach(() => {
    fakeErrorService = { invalidCredentials: vi.fn(), connectionLost: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ErrorService, useValue: fakeErrorService }
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('exists', () => {
    expect(service).toBeTruthy();
  });

  it('POSTs to /api/v1/token', () => {
    service.initialize();
    const req = httpMock.expectOne('/api/v1/token');
    expect(req.request.method).toBe('POST');
  });


  it('sends credentials from environment in the body', () => {
    service.initialize();
    const req = httpMock.expectOne('/api/v1/token');
    expect(req.request.body).toEqual({
      username: environment.username,
      password: environment.password
    });
  });

  it('has no token before the initialization', () => {
    expect(service.getToken()).toBeNull();
  });

  it('gives the token from API response', async () => {
    const initialization = service.initialize();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initialization;
    expect(service.getToken()).toEqual('fake-jwt');
  });

  it('is not ready before the initialization', () => {
    expect(service.isReady()).toBe(false);
  });

  it('is ready once the token is obtained', async () => {
    const initialization = service.initialize();
    httpMock.expectOne('/api/v1/token').flush({ token: 'fake-jwt' });
    await initialization;
    expect(service.isReady()).toBe(true);
  });

  it.each([
    ['invalid credentials', { status: 401, statusText: 'Unauthorized' }],
    ['a server error', { status: 500, statusText: 'Internal Server Error' }],
  ])('stays not ready after %s', async (_cause, response) => {
    const initialization = service.initialize();
    httpMock.expectOne('/api/v1/token').flush(null, response);
    await initialization;
    expect(service.isReady()).toBe(false);
    expect(service.getToken()).toBeNull();
  });

  it('raises an error when invalid credentials', async () => {
    const initialization = service.initialize();
    const req = httpMock.expectOne('/api/v1/token');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
    await initialization;
    expect(fakeErrorService.invalidCredentials).toHaveBeenCalled();
  });

  it('raises a connection error when the server is unreachable', async () => {
    const initialization = service.initialize();
    httpMock.expectOne('/api/v1/token').error(new ProgressEvent('error'));
    await initialization;
    expect(fakeErrorService.connectionLost).toHaveBeenCalled();
    expect(fakeErrorService.invalidCredentials).not.toHaveBeenCalled();
  });

  it('raises a connection error on any other non-2xx response', async () => {
    const initialization = service.initialize();
    httpMock.expectOne('/api/v1/token')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await initialization;
    expect(fakeErrorService.connectionLost).toHaveBeenCalled();
    expect(fakeErrorService.invalidCredentials).not.toHaveBeenCalled();
  });

  describe('refresh', () => {
    it('can serve as the token provider of the WebSocket', () => {
      const provider: TokenProvider = service;
      expect(provider.getToken()).toBeNull();
    });

    it('requests a new token with the credentials from environment', () => {
      service.refresh();
      const req = httpMock.expectOne('/api/v1/token');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: environment.username,
        password: environment.password
      });
    });

    it('replaces the token with the new one', async () => {
      const initialization = service.initialize();
      httpMock.expectOne('/api/v1/token').flush({ token: 'first-jwt' });
      await initialization;

      const refresh = service.refresh();
      httpMock.expectOne('/api/v1/token').flush({ token: 'second-jwt' });
      await refresh;

      expect(service.getToken()).toEqual('second-jwt');
    });

    it.each([
      ['invalid credentials', { status: 401, statusText: 'Unauthorized' }],
      ['a server error', { status: 500, statusText: 'Internal Server Error' }],
    ])('keeps the current token and stays ready after %s, and reports the failure to the caller', async (_cause, response) => {
      const initialization = service.initialize();
      httpMock.expectOne('/api/v1/token').flush({ token: 'first-jwt' });
      await initialization;

      const refresh = service.refresh();
      httpMock.expectOne('/api/v1/token').flush(null, response);

      await expect(refresh).rejects.toBeDefined();
      expect(service.getToken()).toEqual('first-jwt');
      expect(service.isReady()).toBe(true);
      expect(fakeErrorService.invalidCredentials).not.toHaveBeenCalled();
      expect(fakeErrorService.connectionLost).not.toHaveBeenCalled();
    });
  });

  describe('when the server does not answer', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('waits no longer than 10 seconds, then abandons the request', async () => {
      const initialization = service.initialize();
      const req = httpMock.expectOne('/api/v1/token');

      await vi.advanceTimersByTimeAsync(9_999);
      expect(fakeErrorService.connectionLost).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      await initialization;
      expect(req.cancelled).toBe(true);
      expect(fakeErrorService.connectionLost).toHaveBeenCalled();
      expect(fakeErrorService.invalidCredentials).not.toHaveBeenCalled();
    });

    it('gives up refreshing after 10 seconds and reports the failure to the caller', async () => {
      const outcome = service.refresh().then(() => 'resolved', () => 'rejected');
      const req = httpMock.expectOne('/api/v1/token');

      await vi.advanceTimersByTimeAsync(9_999);
      expect(req.cancelled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(req.cancelled).toBe(true);
      expect(await outcome).toBe('rejected');
      expect(fakeErrorService.connectionLost).not.toHaveBeenCalled();
    });
  });
});
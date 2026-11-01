import { TestBed } from "@angular/core/testing";
import { AuthService } from "./auth.service";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { environment } from '../../../environments/environment';
import { Mock } from "vitest";
import { ErrorService } from "../error/error.service";

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

  it('stores the token from API response', async () => {
    const initialization = service.initialize();
    const req = httpMock.expectOne('/api/v1/token');
    req.flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initialization;
    expect(service.token()).toEqual("fake-jwt");
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
  });
});
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
  let fakeErrorService: { invalidCredentials: Mock };

  beforeEach(() => {
    fakeErrorService = { invalidCredentials: vi.fn() };
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

  it('stores the token from API response', () => {
    service.initialize();
    const req = httpMock.expectOne('/api/v1/token');
    req.flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    expect(service.token()).toEqual("fake-jwt");
  });

  it('raises an error when invalid credentials', () => {
    service.initialize();
    const req = httpMock.expectOne('/api/v1/token');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(fakeErrorService.invalidCredentials).toHaveBeenCalled();
  });
});
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { signal, WritableSignal } from '@angular/core';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let tokenSignal: WritableSignal<string | null>;

  beforeEach(() => {
    tokenSignal = signal<string | null>('fake-jwt');
    const fakeAuthService = { token: tokenSignal };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: fakeAuthService }
      ]
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('adds the Authorization header when a token is present', () => {
    httpClient.get('/some-url').subscribe();

    const req = httpMock.expectOne('/some-url');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt');

    req.flush(null);
  });

  it('leaves the request untouched when there is no token', () => {
    tokenSignal.set(null);

    httpClient.get('/some-url').subscribe();

    const req = httpMock.expectOne('/some-url');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush(null);
  });
});
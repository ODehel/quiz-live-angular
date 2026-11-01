import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { ErrorService } from './core/error/error.service';

describe('appConfig', () => {
  let initStatus: ApplicationInitStatus;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    initStatus = TestBed.inject(ApplicationInitStatus);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('holds the application start until the token request is answered', async () => {
    const req = httpMock.expectOne('/api/v1/token');
    expect(initStatus.done).toBe(false);

    req.flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    expect(initStatus.done).toBe(true);
  });

  it('lets the application start when the token request fails', async () => {
    httpMock.expectOne('/api/v1/token')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await initStatus.donePromise;

    expect(initStatus.done).toBe(true);
    expect(TestBed.inject(ErrorService).currentError()).toEqual({ variant: 'invalid-credentials' });
  });
});

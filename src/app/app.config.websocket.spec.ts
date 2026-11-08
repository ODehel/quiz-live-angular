import { ApplicationInitStatus, ApplicationRef } from '@angular/core';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { ErrorService } from './core/error/error.service';
import { environment } from '../environments/environment';
import { WEB_SOCKET_CONSTRUCTOR } from './core/websocket/websocket.providers';
import { SocketLike } from './core/websocket/websocket.service';

class FakeSocket implements SocketLike {
  static instances: FakeSocket[] = [];

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readonly sent: string[] = [];

  constructor(public readonly url: string) {
    FakeSocket.instances.push(this);
  }

  send(message: string): void {
    this.sent.push(message);
  }

  close(): void { }
}

describe('appConfig WebSocket wiring', () => {
  let initStatus: ApplicationInitStatus;
  let httpMock: HttpTestingController;

  const startApplication = () => {
    initStatus = TestBed.inject(ApplicationInitStatus);
    httpMock = TestBed.inject(HttpTestingController);
  };

  beforeEach(() => {
    FakeSocket.instances = [];
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: WEB_SOCKET_CONSTRUCTOR, useValue: FakeSocket },
      ],
    });
  });

  it('opens the WebSocket on the hub once the session is ready', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    expect(FakeSocket.instances.map(socket => socket.url)).toEqual([environment.wsUrl]);
  });

  it('does not open the WebSocket when the token request fails', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await initStatus.donePromise;

    expect(FakeSocket.instances).toEqual([]);
  });

  it('does not open the WebSocket before the token request is answered', () => {
    startApplication();
    httpMock.expectOne('/api/v1/token');

    expect(FakeSocket.instances).toEqual([]);
  });

  it('authenticates the socket with the session token once it is open', async () => {
    startApplication();
    httpMock.expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus.donePromise;

    const [socket] = FakeSocket.instances;
    socket.onopen?.(new Event('open'));

    expect(socket.sent.map(message => JSON.parse(message))).toEqual([{ type: 'auth', token: 'fake-jwt' }]);
  });

  describe('when the hub closes the socket because another tab took the session', () => {
    const startAndCloseWith4004 = async () => {
      startApplication();
      httpMock.expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus.donePromise;
      FakeSocket.instances[0].onclose?.({ code: 4004 } as CloseEvent);
    };

    it('reports that the session was replaced', async () => {
      await startAndCloseWith4004();

      expect(TestBed.inject(ErrorService).currentError()).toEqual({ variant: 'session-replaced' });
    });

    it('navigates to the error page', async () => {
      await startAndCloseWith4004();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(TestBed.inject(Router).url).toBe('/error');
    });
  });
});

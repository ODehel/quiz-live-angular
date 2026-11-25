import { ApplicationInitStatus, ApplicationRef } from '@angular/core';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { ErrorService } from './core/error/error.service';
import { environment } from '../environments/environment';
import { GameStateService } from './core/game-state/game-state.service';
import { TopBar } from './core/layout/top-bar';
import { serverAddress } from './core/websocket/server-address';
import { WEB_SOCKET_CONSTRUCTOR } from './core/websocket/websocket.providers';
import { ClosingFakeSocket, FakeSocket } from './core/websocket/websocket.test-helpers';
import { fullSync as fullSyncMessage } from './core/game-state/game-state.test-helpers';
import {
  guardAgainstUnhandledErrors,
  startAndAnnounceExpired,
  startAndAnnounceExpiry,
  startAndOpenSocket,
  startApplication as startWiredApplication,
} from './app.config.test-helpers';

describe('appConfig WebSocket wiring', () => {
  // Les aides partagées démarrent l'application elles-mêmes ; `TestBed` rend toujours la même instance.
  const initStatus = () => TestBed.inject(ApplicationInitStatus);
  const httpMock = () => TestBed.inject(HttpTestingController);
  const startApplication = () => {
    startWiredApplication();
  };
  // Le test doit surcharger `WEB_SOCKET_CONSTRUCTOR` par `ClosingFakeSocket` avant de démarrer l'application.
  const hubClosesWith = (socket: FakeSocket, code: number) => {
    if (!(socket instanceof ClosingFakeSocket)) {
      throw new Error('hubClosesWith needs a ClosingFakeSocket: override WEB_SOCKET_CONSTRUCTOR first');
    }
    socket.serverClose(code);
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
    httpMock().expectOne('/api/v1/token')
      .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
    await initStatus().donePromise;

    expect(FakeSocket.instances.map(socket => socket.url)).toEqual([environment.wsUrl]);
  });

  it('does not open the WebSocket when the token request fails', async () => {
    startApplication();
    httpMock().expectOne('/api/v1/token')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await initStatus().donePromise;

    expect(FakeSocket.instances).toEqual([]);
  });

  it('does not open the WebSocket before the token request is answered', () => {
    startApplication();
    httpMock().expectOne('/api/v1/token');

    expect(FakeSocket.instances).toEqual([]);
  });

  it('authenticates the socket with the session token once it is open', async () => {
    const socket = await startAndOpenSocket();

    expect(socket.sent.map(message => JSON.parse(message))).toEqual([{ type: 'auth', token: 'fake-jwt' }]);
  });

  describe('when the hub accepts the session', () => {
    const sentTypes = (socket: FakeSocket) => socket.sent.map(message => JSON.parse(message).type);

    it('asks the hub for the game state once', async () => {
      const socket = await startAndOpenSocket();
      socket.onmessage?.(new MessageEvent('message', { data: '{"type":"auth_success"}' }));

      expect(sentTypes(socket)).toEqual(['auth', 'request_game_state']);
    });
  });

  describe('when the hub accepts the session again after a token refresh', () => {
    it('asks the hub for the game state again', async () => {
      const socket = await startAndOpenSocket();
      const receive = (type: string) =>
        socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ type }) }));
      receive('auth_success');
      receive('token_expiring_soon');
      httpMock().expectOne('/api/v1/token')
        .flush({ token: 'fresh-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await TestBed.inject(ApplicationRef).whenStable();
      receive('auth_success');

      expect(socket.sent.map(message => JSON.parse(message).type))
        .toEqual(['auth', 'request_game_state', 'auth_refresh', 'request_game_state']);
    });
  });

  describe('when the hub announces that the token is about to expire', () => {
    guardAgainstUnhandledErrors({ simulatedTime: true });

    const answerRefresh = async (token: string) => {
      httpMock().expectOne('/api/v1/token')
        .flush({ token, expiresIn: 3600, tokenType: 'Bearer' });
      await vi.advanceTimersByTimeAsync(0);
    };
    const failRefresh = async () => {
      httpMock().expectOne('/api/v1/token')
        .flush(null, { status: 503, statusText: 'Service Unavailable' });
      await vi.advanceTimersByTimeAsync(0);
    };
    const sentMessages = (socket: FakeSocket) => socket.sent.map(message => JSON.parse(message));

    it('requests a new token in the background, without showing any error', async () => {
      await startAndAnnounceExpiry();

      httpMock().expectOne('/api/v1/token');
      expect(TestBed.inject(ErrorService).currentError()).toBeNull();
    });

    it('sends the new token on the existing connection, without opening another socket', async () => {
      const socket = await startAndAnnounceExpiry();

      await answerRefresh('fresh-jwt');
      await vi.advanceTimersByTimeAsync(60_000);

      expect(sentMessages(socket).slice(2)).toEqual([{ type: 'auth_refresh', token: 'fresh-jwt' }]);
      expect(socket.closes).toEqual([]);
      expect(FakeSocket.instances).toEqual([socket]);
    });

    it('sends nothing and shows no error while the refresh has failed, until the 5 s retry', async () => {
      const socket = await startAndAnnounceExpiry();

      await failRefresh();
      await vi.advanceTimersByTimeAsync(4999);

      httpMock().expectNone('/api/v1/token');
      expect(sentMessages(socket).map(message => message.type)).toEqual(['auth', 'request_game_state']);
      expect(TestBed.inject(ErrorService).currentError()).toBeNull();
    });

    it('retries the refresh after 5 s and sends the token it obtains', async () => {
      const socket = await startAndAnnounceExpiry();
      await failRefresh();
      await vi.advanceTimersByTimeAsync(5000);

      await answerRefresh('retried-jwt');

      expect(sentMessages(socket).slice(2)).toEqual([{ type: 'auth_refresh', token: 'retried-jwt' }]);
      expect(socket.closes).toEqual([]);
    });

    it('keeps the connection open between the failed attempts and gives up after the third', async () => {
      const socket = await startAndAnnounceExpiry();
      await failRefresh();
      await vi.advanceTimersByTimeAsync(5000);
      await failRefresh();
      await vi.advanceTimersByTimeAsync(5000);

      expect(socket.closes).toEqual([]);
      await failRefresh();
      await vi.advanceTimersByTimeAsync(60_000);

      httpMock().expectNone('/api/v1/token');
      expect(socket.closes).toEqual([{ code: 1000, reason: 'Token refresh failed' }]);
      expect(sentMessages(socket).map(message => message.type)).toEqual(['auth', 'request_game_state']);
    });

    it('restarts the full connection with the current token once the refresh failed three times', async () => {
      // La socket enchaîne `onclose` après `close()`, comme un navigateur : la fermeture vient du service,
      // aucun `onclose` n'est appelé à la main (voir DEBTS.md).
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ClosingFakeSocket });
      const socket = await startAndAnnounceExpiry();
      await failRefresh();
      await vi.advanceTimersByTimeAsync(5000);
      await failRefresh();
      await vi.advanceTimersByTimeAsync(5000);
      expect(socket.closes).toEqual([]);
      expect(FakeSocket.instances).toHaveLength(1);

      await failRefresh();

      expect(socket.closes).toEqual([{ code: 1000, reason: 'Token refresh failed' }]);
      expect(FakeSocket.instances).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(999);
      expect(FakeSocket.instances).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(FakeSocket.instances).toHaveLength(2);
      httpMock().expectNone('/api/v1/token');
      const second = FakeSocket.instances[1];
      second.onopen?.(new Event('open'));
      expect(sentMessages(second)).toEqual([{ type: 'auth', token: 'fake-jwt' }]);
      expect(TestBed.inject(ErrorService).currentError()).toBeNull();
    });
  });

  describe('when the hub announces that the token has expired', () => {
    guardAgainstUnhandledErrors({ simulatedTime: true });

    const answerRefresh = async () => {
      httpMock().expectOne('/api/v1/token')
        .flush({ token: 'fresh-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await vi.advanceTimersByTimeAsync(0);
    };
    // La fermeture `4002` est décidée par le hub : la socket enchaîne `onclose` sans `close()` du service.
    const closeWith4002AndAnswerRefresh = async (socket: FakeSocket) => {
      hubClosesWith(socket, 4002);
      await answerRefresh();
    };
    const sentMessages = (socket: FakeSocket) => socket.sent.map(message => JSON.parse(message));

    it('does nothing by itself: no token request, no message, no closing, no other socket', async () => {
      const socket = await startAndAnnounceExpired();
      await vi.advanceTimersByTimeAsync(60_000);

      httpMock().expectNone('/api/v1/token');
      expect(sentMessages(socket).map(message => message.type)).toEqual(['auth', 'request_game_state']);
      expect(socket.closes).toEqual([]);
      expect(FakeSocket.instances).toEqual([socket]);
      expect(TestBed.inject(ErrorService).currentError()).toBeNull();
    });

    it('requests a single new token and reconnects once when the hub then closes with 4002', async () => {
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ClosingFakeSocket });
      const socket = await startAndAnnounceExpired();

      await closeWith4002AndAnswerRefresh(socket);
      expect(FakeSocket.instances).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(60_000);

      httpMock().expectNone('/api/v1/token');
      expect(socket.closes).toEqual([]);
      expect(FakeSocket.instances).toHaveLength(2);
      expect(TestBed.inject(ErrorService).currentError()).toBeNull();
    });

    it('authenticates the second socket with the new token', async () => {
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ClosingFakeSocket });
      const socket = await startAndAnnounceExpired();
      await closeWith4002AndAnswerRefresh(socket);
      await vi.advanceTimersByTimeAsync(1000);

      const second = FakeSocket.instances[1];
      second.onopen?.(new Event('open'));

      expect(sentMessages(second)).toEqual([{ type: 'auth', token: 'fresh-jwt' }]);
    });

    it('waits for the new token before reconnecting, even when the token request is slow', async () => {
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ClosingFakeSocket });
      const socket = await startAndAnnounceExpired();

      hubClosesWith(socket, 4002);
      await vi.advanceTimersByTimeAsync(5000);
      expect(FakeSocket.instances).toHaveLength(1);
      await answerRefresh();
      await vi.advanceTimersByTimeAsync(1000);

      expect(FakeSocket.instances).toHaveLength(2);
      const second = FakeSocket.instances[1];
      second.onopen?.(new Event('open'));
      expect(sentMessages(second)).toEqual([{ type: 'auth', token: 'fresh-jwt' }]);
    });
  });

  describe('when the hub closes the socket because another tab took the session', () => {
    afterEach(() => vi.useRealTimers());

    // La fermeture `4004` est décidée par le hub : la socket enchaîne `onclose` sans `close()` du service.
    const startAndCloseWith4004 = async () => {
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ClosingFakeSocket });
      startApplication();
      httpMock().expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus().donePromise;
      const socket = FakeSocket.instances[0];
      hubClosesWith(socket, 4004);
      return socket;
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

    it('does not reconnect to the hub', async () => {
      vi.useFakeTimers();
      const socket = await startAndCloseWith4004();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(FakeSocket.instances).toEqual([socket]);
    });

    it('does not close the socket itself', async () => {
      vi.useFakeTimers();
      const socket = await startAndCloseWith4004();
      await vi.advanceTimersByTimeAsync(60_000);

      expect(socket.closes).toEqual([]);
    });

    it('does not ask for a new token', async () => {
      vi.useFakeTimers();
      await startAndCloseWith4004();
      await vi.advanceTimersByTimeAsync(60_000);

      httpMock().expectNone('/api/v1/token');
    });
  });

  describe('when opening the socket throws', () => {
    afterEach(() => vi.useRealTimers());

    class ThrowingSocket {
      static attempts = 0;
      constructor() {
        ThrowingSocket.attempts++;
        throw new TypeError('invalid url');
      }
    }
    // Ouvre une première socket saine (fermée par le hub avec `1006`), puis la reprise lève.
    class FailsOnResumeSocket extends ClosingFakeSocket {
      constructor(url: string) {
        if (FakeSocket.instances.length > 0) {
          ThrowingSocket.attempts++;
          throw new TypeError('invalid url');
        }
        super(url);
      }
    }
    const startWith = async (constructor: unknown) => {
      ThrowingSocket.attempts = 0;
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: constructor });
      startApplication();
      httpMock().expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus().donePromise;
    };

    it('starts the application anyway, on the error page', async () => {
      await startWith(ThrowingSocket);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(TestBed.inject(Router).url).toBe('/error');
    });

    it('reports a lost connection when the opening at startup throws', async () => {
      await startWith(ThrowingSocket);

      expect(TestBed.inject(ErrorService).currentError()).toEqual({ variant: 'connection-lost' });
    });

    it('does not try to open the socket again after the opening at startup threw', async () => {
      vi.useFakeTimers();
      await startWith(ThrowingSocket);
      await vi.advanceTimersByTimeAsync(120_000);

      expect(ThrowingSocket.attempts).toBe(1);
    });

    it('reports a lost connection when the reconnection throws', async () => {
      vi.useFakeTimers();
      await startWith(FailsOnResumeSocket);
      FakeSocket.instances[0].simulateClose(1006);
      await vi.advanceTimersByTimeAsync(1000);

      expect(TestBed.inject(ErrorService).currentError()).toEqual({ variant: 'connection-lost' });
    });

    it('does not try to open the socket again after the reconnection threw', async () => {
      vi.useFakeTimers();
      await startWith(FailsOnResumeSocket);
      FakeSocket.instances[0].simulateClose(1006);
      await vi.advanceTimersByTimeAsync(120_000);

      expect(ThrowingSocket.attempts).toBe(1);
    });
  });

  describe('when the socket closes while buzzers are connected', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it.each([1000, 1006, 4002, 4004])('keeps the connected buzzers when the socket closes with %s', async code => {
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ClosingFakeSocket });
      const socket = await startAndOpenSocket();
      ['quiz_buzzer_01', 'quiz_buzzer_02'].forEach(username =>
        socket.onmessage?.(new MessageEvent('message', {
          data: JSON.stringify({ type: 'buzzer_connected', username }),
        })));
      const gameState = TestBed.inject(GameStateService);
      const before = gameState.connectedBuzzers();

      hubClosesWith(socket, code);
      httpMock().match('/api/v1/token').forEach(request =>
        request.flush({ token: 'fresh-jwt', expiresIn: 3600, tokenType: 'Bearer' }));
      await vi.advanceTimersByTimeAsync(1000);

      expect(before).toEqual(['quiz_buzzer_01', 'quiz_buzzer_02']);
      expect(gameState.connectedBuzzers()).toEqual(before);
    });
  });

  describe('when the wired socket receives game state messages', () => {
    guardAgainstUnhandledErrors({ simulatedTime: false });

    const receive = (socket: FakeSocket, message: Record<string, unknown>) =>
      socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }));
    const fullSync = (changes: Record<string, unknown> = {}) =>
      fullSyncMessage({ connected_buzzers: ['quiz_buzzer_01', 'quiz_buzzer_02'], ...changes });

    it('restores the game and the connected buzzers from a full game_state_sync', async () => {
      const socket = await startAndOpenSocket();

      receive(socket, fullSync());

      const gameState = TestBed.inject(GameStateService);
      expect(gameState.state()).toMatchObject({
        gameId: 'game-1',
        status: 'OPEN',
        questionIndex: 2,
        quizId: 'quiz-1',
        participants: [{ order: 1, name: 'Alice', cumulative_score: 30 }],
      });
      expect(gameState.connectedBuzzers()).toEqual(['quiz_buzzer_01', 'quiz_buzzer_02']);
    });

    it('lists a buzzer that connects once, in arrival order', async () => {
      const socket = await startAndOpenSocket();

      ['quiz_buzzer_02', 'quiz_buzzer_01', 'quiz_buzzer_02'].forEach(username =>
        receive(socket, { type: 'buzzer_connected', username }));

      expect(TestBed.inject(GameStateService).connectedBuzzers()).toEqual(['quiz_buzzer_02', 'quiz_buzzer_01']);
    });

    it('removes a buzzer that disconnects', async () => {
      const socket = await startAndOpenSocket();
      ['quiz_buzzer_01', 'quiz_buzzer_02'].forEach(username =>
        receive(socket, { type: 'buzzer_connected', username }));

      receive(socket, { type: 'buzzer_disconnected', username: 'quiz_buzzer_01' });

      expect(TestBed.inject(GameStateService).connectedBuzzers()).toEqual(['quiz_buzzer_02']);
    });

    it('leaves the connected buzzers as they are, without asking the hub, when an unlisted buzzer disconnects', async () => {
      const socket = await startAndOpenSocket();
      receive(socket, { type: 'buzzer_connected', username: 'quiz_buzzer_01' });
      const gameState = TestBed.inject(GameStateService);
      const before = gameState.connectedBuzzers();

      receive(socket, { type: 'buzzer_disconnected', username: 'quiz_buzzer_09' });

      expect(gameState.connectedBuzzers()).toBe(before);
      expect(socket.sent.map(message => JSON.parse(message).type)).toEqual(['auth']);
    });

    it('replaces the connected buzzers in bulk with those of a game_state_sync that carries no game', async () => {
      const socket = await startAndOpenSocket();
      ['quiz_buzzer_01', 'quiz_buzzer_02'].forEach(username =>
        receive(socket, { type: 'buzzer_connected', username }));

      receive(socket, { type: 'game_state_sync', connected_buzzers: ['quiz_buzzer_03', 'quiz_buzzer_01'] });

      expect(TestBed.inject(GameStateService).connectedBuzzers()).toEqual(['quiz_buzzer_03', 'quiz_buzzer_01']);
    });

    it('keeps the game state when a game_state_sync that carries no game changes the connected buzzers', async () => {
      const socket = await startAndOpenSocket();
      receive(socket, fullSync());
      const gameState = TestBed.inject(GameStateService);
      const before = gameState.state();

      receive(socket, { type: 'game_state_sync', connected_buzzers: ['quiz_buzzer_07'] });

      expect(gameState.state()).toBe(before);
      expect(gameState.connectedBuzzers()).toEqual(['quiz_buzzer_07']);
    });

    describe('after the socket closed and the connection resumed', () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      it.each([1000, 1006, 4002])('replaces the connected buzzers kept through the close %s with those of the next game_state_sync', async code => {
        TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ClosingFakeSocket });
        const first = await startAndOpenSocket();
        ['quiz_buzzer_01', 'quiz_buzzer_02'].forEach(username =>
          receive(first, { type: 'buzzer_connected', username }));
        const gameState = TestBed.inject(GameStateService);
        hubClosesWith(first, code);
        httpMock().match('/api/v1/token').forEach(request =>
          request.flush({ token: 'fresh-jwt', expiresIn: 3600, tokenType: 'Bearer' }));
        await vi.advanceTimersByTimeAsync(1000);
        const kept = gameState.connectedBuzzers();
        const second = FakeSocket.instances[1];
        second.onopen?.(new Event('open'));

        receive(second, { type: 'game_state_sync', connected_buzzers: ['quiz_buzzer_02', 'quiz_buzzer_03'] });

        expect(FakeSocket.instances).toHaveLength(2);
        expect(kept).toEqual(['quiz_buzzer_01', 'quiz_buzzer_02']);
        expect(gameState.connectedBuzzers()).toEqual(['quiz_buzzer_02', 'quiz_buzzer_03']);
      });
    });
  });

  describe('the top bar reading the wired application', () => {
    guardAgainstUnhandledErrors({ simulatedTime: true });

    const topBar = () => TestBed.createComponent(TopBar);
    const textOf = (fixture: ReturnType<typeof topBar>, testId: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();

    it('shows "Reconnexion…" and the hub address while the socket is open and auth_success is not received', async () => {
      await startAndOpenSocket();
      const fixture = topBar();

      fixture.detectChanges();

      expect(textOf(fixture, 'connection-label')).toBe('Reconnexion…');
      expect(textOf(fixture, 'server-address')).toBe(serverAddress(environment.wsUrl));
    });

    it('shows "Connecté" once auth_success is received', async () => {
      const socket = await startAndOpenSocket();
      socket.simulateMessage(JSON.stringify({ type: 'auth_success' }));
      const fixture = topBar();

      fixture.detectChanges();

      expect(textOf(fixture, 'connection-label')).toBe('Connecté');
    });

    it('keeps "Connecté" while the token is renewed on the open socket', async () => {
      await startAndAnnounceExpiry();
      httpMock().expectOne('/api/v1/token')
        .flush({ token: 'fresh-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await vi.advanceTimersByTimeAsync(0);
      const fixture = topBar();

      fixture.detectChanges();

      expect(textOf(fixture, 'connection-label')).toBe('Connecté');
    });

    it('shows "Reconnexion…" again when the socket closes', async () => {
      const socket = await startAndOpenSocket();
      socket.simulateMessage(JSON.stringify({ type: 'auth_success' }));
      socket.simulateClose(1006);
      const fixture = topBar();

      fixture.detectChanges();

      expect(textOf(fixture, 'connection-label')).toBe('Reconnexion…');
    });

    it('shows "Déconnecté" when opening the socket throws', async () => {
      class ThrowingSocket {
        constructor() {
          throw new TypeError('invalid url');
        }
      }
      TestBed.overrideProvider(WEB_SOCKET_CONSTRUCTOR, { useValue: ThrowingSocket });
      startApplication();
      httpMock().expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus().donePromise;
      const fixture = topBar();

      fixture.detectChanges();

      expect(textOf(fixture, 'connection-label')).toBe('Déconnecté');
    });
  });
});

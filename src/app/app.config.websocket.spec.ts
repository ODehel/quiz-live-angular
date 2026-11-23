import { ApplicationInitStatus, ApplicationRef } from '@angular/core';
import { Router } from '@angular/router';
import { config } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { ErrorService } from './core/error/error.service';
import { environment } from '../environments/environment';
import { GameStateService } from './core/game-state/game-state.service';
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

  describe('when the hub accepts the session', () => {
    const startAndOpenSocket = async () => {
      startApplication();
      httpMock.expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus.donePromise;
      const [socket] = FakeSocket.instances;
      socket.onopen?.(new Event('open'));
      return socket;
    };
    const sentTypes = (socket: FakeSocket) => socket.sent.map(message => JSON.parse(message).type);

    it('asks the hub for the game state once', async () => {
      const socket = await startAndOpenSocket();
      socket.onmessage?.(new MessageEvent('message', { data: '{"type":"auth_success"}' }));

      expect(sentTypes(socket)).toEqual(['auth', 'request_game_state']);
    });
  });

  describe('when the hub accepts the session again after a token refresh', () => {
    it('asks the hub for the game state again', async () => {
      startApplication();
      httpMock.expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus.donePromise;
      const [socket] = FakeSocket.instances;
      const receive = (type: string) =>
        socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ type }) }));
      socket.onopen?.(new Event('open'));
      receive('auth_success');
      receive('token_expiring_soon');
      httpMock.expectOne('/api/v1/token')
        .flush({ token: 'fresh-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await TestBed.inject(ApplicationRef).whenStable();
      receive('auth_success');

      expect(socket.sent.map(message => JSON.parse(message).type))
        .toEqual(['auth', 'request_game_state', 'auth_refresh', 'request_game_state']);
    });
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

  describe('when the socket closes while buzzers are connected', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it.each([1000, 1006, 4002, 4004])('keeps the connected buzzers when the socket closes with %s', async code => {
      startApplication();
      httpMock.expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus.donePromise;
      const [socket] = FakeSocket.instances;
      socket.onopen?.(new Event('open'));
      ['quiz_buzzer_01', 'quiz_buzzer_02'].forEach(username =>
        socket.onmessage?.(new MessageEvent('message', {
          data: JSON.stringify({ type: 'buzzer_connected', username }),
        })));
      const gameState = TestBed.inject(GameStateService);
      const before = gameState.connectedBuzzers();

      socket.onclose?.({ code } as CloseEvent);
      httpMock.match('/api/v1/token').forEach(request =>
        request.flush({ token: 'fresh-jwt', expiresIn: 3600, tokenType: 'Bearer' }));
      await vi.advanceTimersByTimeAsync(1000);

      expect(before).toEqual(['quiz_buzzer_01', 'quiz_buzzer_02']);
      expect(gameState.connectedBuzzers()).toEqual(before);
    });
  });

  describe('when the wired socket receives game state messages', () => {
    let unhandledErrors: unknown[];

    beforeEach(() => {
      unhandledErrors = [];
      config.onUnhandledError = error => unhandledErrors.push(error);
    });
    afterEach(async () => {
      await new Promise(resolve => setTimeout(resolve));
      config.onUnhandledError = null;

      expect(unhandledErrors).toEqual([]);
    });

    const startAndOpenSocket = async () => {
      startApplication();
      httpMock.expectOne('/api/v1/token')
        .flush({ token: 'fake-jwt', expiresIn: 3600, tokenType: 'Bearer' });
      await initStatus.donePromise;
      const [socket] = FakeSocket.instances;
      socket.onopen?.(new Event('open'));
      return socket;
    };
    const receive = (socket: FakeSocket, message: Record<string, unknown>) =>
      socket.onmessage?.(new MessageEvent('message', { data: JSON.stringify(message) }));
    const fullSync = (changes: Record<string, unknown> = {}) => ({
      type: 'game_state_sync',
      game_id: 'game-1',
      status: 'OPEN',
      question_index: 2,
      quiz_id: 'quiz-1',
      participants: [{ order: 1, name: 'Alice', cumulative_score: 30 }],
      connected_buzzers: ['quiz_buzzer_01', 'quiz_buzzer_02'],
      ...changes,
    });

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
        const first = await startAndOpenSocket();
        ['quiz_buzzer_01', 'quiz_buzzer_02'].forEach(username =>
          receive(first, { type: 'buzzer_connected', username }));
        const gameState = TestBed.inject(GameStateService);
        first.onclose?.({ code } as CloseEvent);
        httpMock.match('/api/v1/token').forEach(request =>
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
});

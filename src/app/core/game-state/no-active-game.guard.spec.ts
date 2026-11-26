import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { WebSocketService } from '../websocket/websocket.service';
import { GameStateService } from './game-state.service';
import { fullSync } from './game-state.test-helpers';
import { noActiveGameGuard } from './no-active-game.guard';

describe('noActiveGameGuard', () => {
  let incoming: Subject<string>;
  let disconnected: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    incoming = new Subject<string>();
    disconnected = signal(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: GameStateService, useFactory: () => new GameStateService({ messages$: incoming, send: () => {} }) },
        { provide: WebSocketService, useValue: { isDisconnected: disconnected.asReadonly() } }
      ]
    });
  });

  const gameIsAt = (status: string) => incoming.next(JSON.stringify(fullSync({ status })));

  const runGuard = () => TestBed.runInInjectionContext(() =>
    noActiveGameGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  it('redirects to the lobby when the game is pending', () => {
    TestBed.inject(GameStateService);
    gameIsAt('PENDING');

    const result = runGuard();

    expect(result).toEqual(TestBed.inject(Router).parseUrl('/pilot/lobby'));
  });

  it.each(['OPEN', 'QUESTION_TITLE', 'QUESTION_OPEN', 'QUESTION_BUZZED', 'QUESTION_CLOSED'])(
    'redirects to the play page when the game is %s', status => {
      TestBed.inject(GameStateService);
      gameIsAt(status);

      const result = runGuard();

      expect(result).toEqual(TestBed.inject(Router).parseUrl('/pilot/play'));
    });

  it('lets the navigation through when no game is known', () => {
    TestBed.inject(GameStateService);

    const result = runGuard();

    expect(result).toBe(true);
  });

  it.each(['COMPLETED', 'IN_ERROR'])('lets the navigation through when the game is %s', status => {
    TestBed.inject(GameStateService);
    gameIsAt(status);

    const result = runGuard();

    expect(result).toBe(true);
  });

  it.each(['PENDING', 'OPEN', 'QUESTION_OPEN'])(
    'lets the navigation through when the application is disconnected, even if the game is %s', status => {
      TestBed.inject(GameStateService);
      gameIsAt(status);
      disconnected.set(true);

      const result = runGuard();

      expect(result).toBe(true);
    });
});

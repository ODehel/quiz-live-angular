import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { GameStateService } from '../../core/game-state/game-state.service';
import { WebSocketService } from '../../core/websocket/websocket.service';
import { QuestionService } from '../questions/question.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let incoming: Subject<string>;
  let disconnected: ReturnType<typeof signal<boolean>>;
  let questionCount: Subject<number>;
  let questionCountCalls: number;

  const render = () => {
    incoming = new Subject<string>();
    const hub = { messages$: incoming, send: () => {} };
    disconnected = signal(false);
    questionCount = new Subject<number>();
    questionCountCalls = 0;
    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useFactory: () => new GameStateService(hub) },
        { provide: WebSocketService, useValue: { isDisconnected: disconnected.asReadonly() } },
        { provide: QuestionService, useValue: { count: () => { questionCountCalls++; return questionCount; } } },
      ],
    });
    return TestBed.createComponent(Dashboard);
  };

  const element = (fixture: ComponentFixture<Dashboard>) => fixture.nativeElement as HTMLElement;
  const textOf = (fixture: ComponentFixture<Dashboard>, testId: string) =>
    element(fixture).querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();

  const rowsOf = (fixture: ComponentFixture<Dashboard>) =>
    Array.from(element(fixture).querySelectorAll('[data-testid="buzzers-card"] [data-testid="buzzer-row"]'))
      .map(row => row.textContent?.trim());

  it('shows a dash as the number of connected buzzers before any game_state_sync', async () => {
    const fixture = render();

    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-value')).toBe('—');
  });

  it('shows the number of connected buzzers of a game_state_sync', async () => {
    const fixture = render();

    incoming.next('{"type":"game_state_sync","connected_buzzers":["alice","bob"]}');
    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-value')).toBe('2');
  });

  const sync = (buzzers: string[]) => incoming.next(JSON.stringify({ type: 'game_state_sync', connected_buzzers: buzzers }));
  const connect = (username: string) => incoming.next(JSON.stringify({ type: 'buzzer_connected', username }));
  const disconnect = (username: string) => incoming.next(JSON.stringify({ type: 'buzzer_disconnected', username }));

  it('shows 0 when the hub reports that no buzzer is connected', async () => {
    const fixture = render();

    sync([]);
    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-value')).toBe('0');
  });

  it('follows the buzzers that connect and disconnect once the list is known', async () => {
    const fixture = render();
    sync(['alice']);

    connect('bob');
    await fixture.whenStable();
    expect(textOf(fixture, 'buzzers-metric-value')).toBe('2');

    disconnect('alice');
    await fixture.whenStable();
    expect(textOf(fixture, 'buzzers-metric-value')).toBe('1');
  });

  it('lists the usernames of the connected buzzers under the metric, separated by a comma', async () => {
    const fixture = render();

    sync(['alice', 'bob']);
    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-subtitle')).toBe('alice, bob');
  });

  it('lists the three usernames without a remainder when exactly three buzzers are connected', async () => {
    const fixture = render();

    sync(['alice', 'bob', 'charlie']);
    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-subtitle')).toBe('alice, bob, charlie');
  });

  it('adds +1 to the three usernames when four buzzers are connected', async () => {
    const fixture = render();

    sync(['alice', 'bob', 'charlie', 'dave']);
    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-subtitle')).toBe('alice, bob, charlie +1');
  });

  it('lists the first three usernames then the number of the others when more than three buzzers are connected', async () => {
    const fixture = render();

    sync(['alice', 'bob', 'charlie', 'dave', 'erin']);
    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-subtitle')).toBe('alice, bob, charlie +2');
  });

  it('lists each connected buzzer in the buzzers card, in the order of the list', async () => {
    const fixture = render();

    sync(['alice', 'bob', 'charlie', 'dave']);
    await fixture.whenStable();

    expect(rowsOf(fixture)).toEqual(['alice', 'bob', 'charlie', 'dave']);
  });

  it('updates the buzzers card as buzzers connect and disconnect', async () => {
    const fixture = render();
    sync(['alice']);

    connect('bob');
    await fixture.whenStable();
    expect(rowsOf(fixture)).toEqual(['alice', 'bob']);

    disconnect('alice');
    await fixture.whenStable();
    expect(rowsOf(fixture)).toEqual(['bob']);
  });

  it('shows the buzzers card empty when the hub reports that no buzzer is connected', async () => {
    const fixture = render();

    sync([]);
    await fixture.whenStable();

    expect(element(fixture).querySelector('[data-testid="buzzers-card"]')).not.toBeNull();
    expect(rowsOf(fixture)).toEqual([]);
  });

  const expectUnknown = (fixture: ComponentFixture<Dashboard>) => {
    expect(textOf(fixture, 'buzzers-metric-value')).toBe('—');
    expect(textOf(fixture, 'buzzers-metric-subtitle')).toBe('');
    expect(element(fixture).querySelector('[data-testid="buzzers-card"]')).not.toBeNull();
    expect(rowsOf(fixture)).toEqual([]);
  };

  describe('while the list of buzzers has never been received', () => {
    it('shows a dash, no name and an empty card before any message', async () => {
      const fixture = render();

      await fixture.whenStable();

      expectUnknown(fixture);
    });

    it('stays unknown when a buzzer connects alone', async () => {
      const fixture = render();

      connect('alice');
      connect('bob');
      await fixture.whenStable();

      expectUnknown(fixture);
    });

    it('stays unknown when a game_state_sync does not carry the connected buzzers', async () => {
      const fixture = render();

      incoming.next('{"type":"game_state_sync"}');
      await fixture.whenStable();

      expectUnknown(fixture);
    });

    it('stays unknown when the game_state_sync is rejected, as the real hub sends it with objects', async () => {
      const fixture = render();

      incoming.next('{"type":"game_state_sync","connected_buzzers":[{"username":"alice"}]}');
      await fixture.whenStable();

      expectUnknown(fixture);
    });

    it('shows the list of the first game_state_sync in place of the buzzers that connected before it', async () => {
      const fixture = render();
      connect('alice');

      sync(['bob']);
      await fixture.whenStable();

      expect(textOf(fixture, 'buzzers-metric-value')).toBe('1');
      expect(rowsOf(fixture)).toEqual(['bob']);
    });
  });

  it('keeps showing the last list, never a dash, once the list is known', async () => {
    const fixture = render();
    sync(['alice']);

    incoming.next('{"type":"game_state_sync","connected_buzzers":[{"username":"alice"}]}');
    incoming.next('{"type":"game_state_sync"}');
    disconnect('alice');
    await fixture.whenStable();

    expect(textOf(fixture, 'buzzers-metric-value')).toBe('0');
    expect(rowsOf(fixture)).toEqual([]);
  });

  describe('while the application is disconnected', () => {
    it('shows a dash, no name and an empty card instead of the last known list', async () => {
      const fixture = render();
      sync(['alice', 'bob']);
      await fixture.whenStable();

      disconnected.set(true);
      await fixture.whenStable();

      expectUnknown(fixture);
    });

    it('keeps hiding the buzzers when the list is known and empty, where it would show 0', async () => {
      const fixture = render();
      sync([]);
      disconnected.set(true);
      await fixture.whenStable();

      expectUnknown(fixture);
    });

    it('keeps hiding the buzzers that connect, disconnect or are synced meanwhile', async () => {
      const fixture = render();
      sync(['alice']);
      disconnected.set(true);

      connect('bob');
      sync(['carol', 'dave']);
      disconnect('carol');
      await fixture.whenStable();

      expectUnknown(fixture);
    });

    it('does not hide the buzzers while the application is not disconnected', async () => {
      const fixture = render();

      sync(['alice', 'bob']);
      await fixture.whenStable();

      expect(textOf(fixture, 'buzzers-metric-value')).toBe('2');
      expect(rowsOf(fixture)).toEqual(['alice', 'bob']);
    });
  });

  describe('the questions metric', () => {
    const loadingOf = (fixture: ComponentFixture<Dashboard>) =>
      element(fixture).querySelector('[data-testid="questions-metric-loading"]');

    it('is labelled "Questions"', async () => {
      const fixture = render();

      await fixture.whenStable();

      expect(textOf(fixture, 'questions-metric-label')).toBe('Questions');
    });

    it('asks the hub for the number of questions once, when the dashboard opens', async () => {
      const fixture = render();

      await fixture.whenStable();

      expect(questionCountCalls).toBe(1);
    });

    it('shows the total counted by the hub', async () => {
      const fixture = render();

      questionCount.next(147);
      await fixture.whenStable();

      expect(textOf(fixture, 'questions-metric-value')).toBe('147');
    });

    it('shows 0 when the hub counts no question', async () => {
      const fixture = render();

      questionCount.next(0);
      await fixture.whenStable();

      expect(textOf(fixture, 'questions-metric-value')).toBe('0');
    });

    it('shows a loading indicator in place of the value while the hub has not answered', async () => {
      const fixture = render();

      await fixture.whenStable();

      expect(loadingOf(fixture)).not.toBeNull();
      expect(textOf(fixture, 'questions-metric-value')).toBeUndefined();
    });

    it('replaces the loading indicator with the total once the hub answers', async () => {
      const fixture = render();
      await fixture.whenStable();

      questionCount.next(12);
      await fixture.whenStable();

      expect(loadingOf(fixture)).toBeNull();
      expect(textOf(fixture, 'questions-metric-value')).toBe('12');
    });

    it('stops waiting for the hub when the dashboard is destroyed', async () => {
      const fixture = render();
      await fixture.whenStable();

      fixture.destroy();

      expect(questionCount.observed).toBe(false);
    });

    it('shows a dash in place of the loading indicator when the call fails', async () => {
      const fixture = render();
      await fixture.whenStable();

      questionCount.error(new Error('500'));
      await fixture.whenStable();

      expect(loadingOf(fixture)).toBeNull();
      expect(textOf(fixture, 'questions-metric-value')).toBe('—');
    });

    it('does not stop the buzzers from showing when the call fails', async () => {
      const fixture = render();

      questionCount.error(new Error('500'));
      sync(['alice', 'bob']);
      await fixture.whenStable();

      expect(textOf(fixture, 'buzzers-metric-value')).toBe('2');
      expect(rowsOf(fixture)).toEqual(['alice', 'bob']);
    });

    it('does not wait for the buzzers: the total shows before any game_state_sync', async () => {
      const fixture = render();

      questionCount.next(5);
      await fixture.whenStable();

      expect(textOf(fixture, 'questions-metric-value')).toBe('5');
      expect(textOf(fixture, 'buzzers-metric-value')).toBe('—');
    });

    it('keeps showing the total while the application is disconnected', async () => {
      const fixture = render();
      disconnected.set(true);

      questionCount.next(5);
      await fixture.whenStable();

      expect(textOf(fixture, 'questions-metric-value')).toBe('5');
    });

    it('keeps the loading indicator while the application is disconnected and the hub has not answered', async () => {
      const fixture = render();
      disconnected.set(true);

      await fixture.whenStable();

      expect(loadingOf(fixture)).not.toBeNull();
    });
  });

  describe('the quiz and played games metrics', () => {
    const loadingOf = (fixture: ComponentFixture<Dashboard>, metric: string) =>
      element(fixture).querySelector(`[data-testid="${metric}-metric-loading"]`);

    it('are labelled "Quiz" and "Parties jouées"', async () => {
      const fixture = render();

      await fixture.whenStable();

      expect(textOf(fixture, 'quizzes-metric-label')).toBe('Quiz');
      expect(textOf(fixture, 'games-metric-label')).toBe('Parties jouées');
    });

    it('show a dash as soon as the dashboard opens, while the questions are still loading', async () => {
      const fixture = render();

      await fixture.whenStable();

      expect(textOf(fixture, 'quizzes-metric-value')).toBe('—');
      expect(textOf(fixture, 'games-metric-value')).toBe('—');
      expect(loadingOf(fixture, 'quizzes')).toBeNull();
      expect(loadingOf(fixture, 'games')).toBeNull();
    });

    it('keep their dash once the questions are counted', async () => {
      const fixture = render();

      questionCount.next(147);
      await fixture.whenStable();

      expect(textOf(fixture, 'quizzes-metric-value')).toBe('—');
      expect(textOf(fixture, 'games-metric-value')).toBe('—');
    });

    it('keep their dash when the questions call fails', async () => {
      const fixture = render();

      questionCount.error(new Error('500'));
      await fixture.whenStable();

      expect(textOf(fixture, 'quizzes-metric-value')).toBe('—');
      expect(textOf(fixture, 'games-metric-value')).toBe('—');
    });

    it('keep their dash while the application is disconnected, and before any game_state_sync', async () => {
      const fixture = render();
      disconnected.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'quizzes-metric-value')).toBe('—');
      expect(textOf(fixture, 'games-metric-value')).toBe('—');
    });
  });

  describe('the requests of the dashboard', () => {
    it('are one GET of the questions, with a limit of 1 and no page, and nothing else', async () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: GameStateService, useValue: { buzzersKnown: signal(false), connectedBuzzers: signal<string[]>([]) } },
          { provide: WebSocketService, useValue: { isDisconnected: signal(false) } },
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
      const httpMock = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(Dashboard);

      await fixture.whenStable();
      httpMock.expectOne('/api/v1/questions?limit=1').flush({ data: [], page: 1, limit: 1, total: 3, total_pages: 3 });
      await fixture.whenStable();

      httpMock.verify();
      expect(textOf(fixture, 'questions-metric-value')).toBe('3');
    });
  });
});

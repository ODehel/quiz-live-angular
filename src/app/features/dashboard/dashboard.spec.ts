import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { GameStateService } from '../../core/game-state/game-state.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let incoming: Subject<string>;

  const render = () => {
    incoming = new Subject<string>();
    const hub = { messages$: incoming, send: () => {} };
    TestBed.configureTestingModule({
      providers: [{ provide: GameStateService, useFactory: () => new GameStateService(hub) }],
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

  describe('while the list of buzzers has never been received', () => {
    const expectUnknown = (fixture: ComponentFixture<Dashboard>) => {
      expect(textOf(fixture, 'buzzers-metric-value')).toBe('—');
      expect(textOf(fixture, 'buzzers-metric-subtitle')).toBe('');
      expect(element(fixture).querySelector('[data-testid="buzzers-card"]')).not.toBeNull();
      expect(rowsOf(fixture)).toEqual([]);
    };

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
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WebSocketService } from '../websocket/websocket.service';
import { SERVER_ADDRESS } from '../websocket/websocket.providers';
import { TopBar } from './top-bar';

describe('TopBar', () => {
  let connected: ReturnType<typeof signal<boolean>>;
  let reconnecting: ReturnType<typeof signal<boolean>>;
  let disconnected: ReturnType<typeof signal<boolean>>;

  const render = (address = 'localhost:3000') => {
    connected = signal(false);
    reconnecting = signal(false);
    disconnected = signal(false);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WebSocketService,
          useValue: {
            isConnected: connected.asReadonly(),
            isReconnecting: reconnecting.asReadonly(),
            isDisconnected: disconnected.asReadonly(),
          },
        },
        { provide: SERVER_ADDRESS, useValue: address },
      ],
    });
    return TestBed.createComponent(TopBar);
  };

  const element = (fixture: ComponentFixture<TopBar>) => fixture.nativeElement as HTMLElement;
  const part = (fixture: ComponentFixture<TopBar>, testId: string) =>
    element(fixture).querySelector(`[data-testid="${testId}"]`);
  const textOf = (fixture: ComponentFixture<TopBar>, testId: string) => part(fixture, testId)?.textContent?.trim();
  const stateOf = (fixture: ComponentFixture<TopBar>) => part(fixture, 'connection-status')?.getAttribute('data-state');

  describe('when the session is authenticated', () => {
    it('shows the green "Connecté" indicator', async () => {
      const fixture = render();
      connected.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'connection-label')).toBe('Connecté');
      expect(stateOf(fixture)).toBe('connected');
    });

    it('shows the server address next to the indicator', async () => {
      const fixture = render('localhost:3000');
      connected.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'server-address')).toBe('localhost:3000');
    });
  });

  describe('while the socket is being opened or reopened', () => {
    it('shows the orange "Reconnexion…" indicator', async () => {
      const fixture = render();
      reconnecting.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'connection-label')).toBe('Reconnexion…');
      expect(stateOf(fixture)).toBe('reconnecting');
    });

    it('shows the server address next to the indicator', async () => {
      const fixture = render('192.168.1.10:3000');
      reconnecting.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'server-address')).toBe('192.168.1.10:3000');
    });

    it('stays orange, with no time limit, while no auth_success comes', async () => {
      vi.useFakeTimers();
      try {
        const fixture = render();
        reconnecting.set(true);
        fixture.detectChanges();

        await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
        fixture.detectChanges();

        expect(stateOf(fixture)).toBe('reconnecting');
        expect(textOf(fixture, 'connection-label')).toBe('Reconnexion…');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('when the socket could not be opened', () => {
    it('shows the red "Déconnecté" indicator', async () => {
      const fixture = render();
      disconnected.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'connection-label')).toBe('Déconnecté');
      expect(stateOf(fixture)).toBe('disconnected');
    });

    it('shows the server address next to the indicator', async () => {
      const fixture = render('h');
      disconnected.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'server-address')).toBe('h');
    });

    it('shows the address as it is, even when it is the raw value of an invalid wsUrl', async () => {
      const fixture = render('not a url');
      disconnected.set(true);

      await fixture.whenStable();

      expect(textOf(fixture, 'server-address')).toBe('not a url');
    });

    it('is a label only: no button, no link, no tooltip, nothing to click', async () => {
      const fixture = render();
      disconnected.set(true);

      await fixture.whenStable();

      const bar = element(fixture);
      expect(bar.querySelector('button, a, [role="button"], [tabindex]')).toBeNull();
      expect(bar.querySelector('[title]')).toBeNull();
      expect(bar.querySelector('[data-testid="retry"]')).toBeNull();
    });
  });

  describe('when the state changes', () => {
    it('goes from orange to green, then to orange again, with the same address', async () => {
      const fixture = render('localhost:3000');
      reconnecting.set(true);
      await fixture.whenStable();
      expect(stateOf(fixture)).toBe('reconnecting');

      reconnecting.set(false);
      connected.set(true);
      await fixture.whenStable();
      expect(stateOf(fixture)).toBe('connected');
      expect(textOf(fixture, 'server-address')).toBe('localhost:3000');

      connected.set(false);
      reconnecting.set(true);
      await fixture.whenStable();
      expect(stateOf(fixture)).toBe('reconnecting');
      expect(textOf(fixture, 'server-address')).toBe('localhost:3000');
    });

    it('goes from orange to red, with the same address', async () => {
      const fixture = render('localhost:3000');
      reconnecting.set(true);
      await fixture.whenStable();

      reconnecting.set(false);
      disconnected.set(true);
      await fixture.whenStable();

      expect(stateOf(fixture)).toBe('disconnected');
      expect(textOf(fixture, 'server-address')).toBe('localhost:3000');
    });
  });
});

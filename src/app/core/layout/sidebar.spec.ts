import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { GameStateService } from '../game-state/game-state.service';
import { WebSocketService } from '../websocket/websocket.service';
import { Sidebar } from './sidebar';

@Component({ template: '' })
class BlankPage {}

describe('Sidebar', () => {
  let piloting: ReturnType<typeof signal<boolean>>;
  let disconnected: ReturnType<typeof signal<boolean>>;

  const render = () => {
    piloting = signal(false);
    disconnected = signal(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useValue: { isPiloting: piloting.asReadonly() } },
        { provide: WebSocketService, useValue: { isDisconnected: disconnected.asReadonly() } },
        provideRouter([
          { path: 'dashboard', component: BlankPage },
          { path: 'content/themes', component: BlankPage },
        ]),
      ],
    });
    return TestBed.createComponent(Sidebar);
  };

  const element = (fixture: ComponentFixture<Sidebar>) => fixture.nativeElement as HTMLElement;
  const link = (fixture: ComponentFixture<Sidebar>, testId: string) =>
    element(fixture).querySelector<HTMLAnchorElement>(`[data-testid="${testId}"]`);

  // Le tooltip est porté par l'élément englobant : pointer-events: none supprime celui du lien.
  const tooltipOf = (fixture: ComponentFixture<Sidebar>, testId: string) =>
    link(fixture, testId)?.parentElement?.getAttribute('title') ?? undefined;

  describe('links to the available pages', () => {
    it('shows "Tableau de bord", which leads to /dashboard', async () => {
      const fixture = render();

      await fixture.whenStable();

      const dashboard = link(fixture, 'nav-dashboard');
      expect(dashboard?.textContent?.trim()).toBe('Tableau de bord');
      expect(dashboard?.getAttribute('href')).toBe('/dashboard');
    });

    it('shows "Thèmes", which leads to /content/themes', async () => {
      const fixture = render();

      await fixture.whenStable();

      const themes = link(fixture, 'nav-themes');
      expect(themes?.textContent?.trim()).toBe('Thèmes');
      expect(themes?.getAttribute('href')).toBe('/content/themes');
    });
  });

  describe('links whose route does not exist yet', () => {
    it('leaves Questions, Quiz, Jingles and Toutes les parties out of the DOM, with nothing left behind', async () => {
      const fixture = render();

      await fixture.whenStable();

      const nav = element(fixture).querySelector('[data-testid="sidebar"]');
      expect(Array.from(nav?.children ?? []).map((child) => child.textContent?.trim())).toEqual([
        'Tableau de bord',
        'Thèmes',
      ]);
      for (const label of ['Questions', 'Quiz', 'Jingles', 'Toutes les parties']) {
        expect(nav?.textContent).not.toContain(label);
      }
      expect(element(fixture).querySelectorAll('a').length).toBe(2);
    });
  });

  describe('highlights the link of the current route', () => {
    const isActive = (fixture: ComponentFixture<Sidebar>, testId: string) =>
      link(fixture, testId)?.classList.contains('active') &&
      link(fixture, testId)?.getAttribute('aria-current') === 'page';

    it('highlights "Tableau de bord" on /dashboard, and not "Thèmes"', async () => {
      const fixture = render();
      await TestBed.inject(Router).navigateByUrl('/dashboard');

      await fixture.whenStable();

      expect(isActive(fixture, 'nav-dashboard')).toBe(true);
      expect(link(fixture, 'nav-themes')?.classList.contains('active')).toBe(false);
      expect(link(fixture, 'nav-themes')?.hasAttribute('aria-current')).toBe(false);
    });

    it('highlights "Thèmes" on /content/themes, and not "Tableau de bord"', async () => {
      const fixture = render();
      await TestBed.inject(Router).navigateByUrl('/content/themes');

      await fixture.whenStable();

      expect(isActive(fixture, 'nav-themes')).toBe(true);
      expect(link(fixture, 'nav-dashboard')?.classList.contains('active')).toBe(false);
      expect(link(fixture, 'nav-dashboard')?.hasAttribute('aria-current')).toBe(false);
    });

    it('moves the highlight when the route changes', async () => {
      const fixture = render();
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/dashboard');
      await fixture.whenStable();

      await router.navigateByUrl('/content/themes');
      await fixture.whenStable();

      expect(isActive(fixture, 'nav-themes')).toBe(true);
      expect(link(fixture, 'nav-dashboard')?.classList.contains('active')).toBe(false);
    });
  });

  describe('while a game is in progress', () => {
    const isDisabled = (fixture: ComponentFixture<Sidebar>, testId: string) => {
      const style = getComputedStyle(link(fixture, testId) as HTMLElement);
      return style.opacity === '0.4' && style.pointerEvents === 'none';
    };

    it('disables the "Thèmes" link visually and makes it unclickable', async () => {
      const fixture = render();
      piloting.set(true);

      await fixture.whenStable();

      expect(isDisabled(fixture, 'nav-themes')).toBe(true);
    });

    it('explains why with the tooltip "Indisponible pendant une partie"', async () => {
      const fixture = render();
      piloting.set(true);

      await fixture.whenStable();

      expect(tooltipOf(fixture, 'nav-themes')).toBe('Indisponible pendant une partie');
    });

    it('takes "Thèmes" out of reach of the keyboard too', async () => {
      const fixture = render();
      piloting.set(true);

      await fixture.whenStable();

      const themes = link(fixture, 'nav-themes');
      expect(themes?.hasAttribute('href')).toBe(false);
      expect(themes?.getAttribute('aria-disabled')).toBe('true');
    });

    it('leaves "Tableau de bord" enabled, without tooltip', async () => {
      const fixture = render();
      piloting.set(true);

      await fixture.whenStable();

      expect(isDisabled(fixture, 'nav-dashboard')).toBe(false);
      expect(link(fixture, 'nav-dashboard')?.getAttribute('href')).toBe('/dashboard');
      expect(tooltipOf(fixture, 'nav-dashboard')).toBeUndefined();
    });

    it('enables "Thèmes" again as soon as no game is in progress', async () => {
      const fixture = render();
      piloting.set(true);
      await fixture.whenStable();

      piloting.set(false);
      await fixture.whenStable();

      expect(isDisabled(fixture, 'nav-themes')).toBe(false);
      expect(link(fixture, 'nav-themes')?.getAttribute('href')).toBe('/content/themes');
      expect(link(fixture, 'nav-themes')?.hasAttribute('aria-disabled')).toBe(false);
      expect(tooltipOf(fixture, 'nav-themes')).toBeUndefined();
    });
  });

  describe('highlights the link of the current route while a game is in progress', () => {
    const isHighlighted = (fixture: ComponentFixture<Sidebar>, testId: string) =>
      link(fixture, testId)?.classList.contains('active') === true &&
      link(fixture, testId)?.getAttribute('aria-current') === 'page';

    it('keeps the disabled "Thèmes" highlighted on /content/themes', async () => {
      const fixture = render();
      piloting.set(true);
      await TestBed.inject(Router).navigateByUrl('/content/themes');

      await fixture.whenStable();

      const themes = link(fixture, 'nav-themes');
      expect(isHighlighted(fixture, 'nav-themes')).toBe(true);
      expect(themes?.classList.contains('locked')).toBe(true);
      expect(themes?.getAttribute('aria-disabled')).toBe('true');
      expect(themes?.hasAttribute('href')).toBe(false);
      expect(tooltipOf(fixture, 'nav-themes')).toBe('Indisponible pendant une partie');
    });

    it('does not highlight the disabled "Thèmes" on another route, and still highlights "Tableau de bord"', async () => {
      const fixture = render();
      piloting.set(true);
      await TestBed.inject(Router).navigateByUrl('/dashboard');

      await fixture.whenStable();

      expect(link(fixture, 'nav-themes')?.classList.contains('active')).toBe(false);
      expect(link(fixture, 'nav-themes')?.hasAttribute('aria-current')).toBe(false);
      expect(isHighlighted(fixture, 'nav-dashboard')).toBe(true);
    });

    it('highlights "Thèmes" as soon as a game starts while /content/themes is open', async () => {
      const fixture = render();
      await TestBed.inject(Router).navigateByUrl('/content/themes');
      await fixture.whenStable();

      piloting.set(true);
      await fixture.whenStable();

      expect(isHighlighted(fixture, 'nav-themes')).toBe(true);
      expect(link(fixture, 'nav-themes')?.classList.contains('locked')).toBe(true);
    });

    it('keeps "Thèmes" highlighted when the game ends while /content/themes is open', async () => {
      const fixture = render();
      piloting.set(true);
      await TestBed.inject(Router).navigateByUrl('/content/themes');
      await fixture.whenStable();

      piloting.set(false);
      await fixture.whenStable();

      expect(isHighlighted(fixture, 'nav-themes')).toBe(true);
      expect(link(fixture, 'nav-themes')?.classList.contains('locked')).toBe(false);
    });

    it('highlights an enabled "Thèmes" on /content/themes while disconnected, even if a game is in progress', async () => {
      const fixture = render();
      piloting.set(true);
      disconnected.set(true);
      await TestBed.inject(Router).navigateByUrl('/content/themes');

      await fixture.whenStable();

      expect(isHighlighted(fixture, 'nav-themes')).toBe(true);
      expect(link(fixture, 'nav-themes')?.classList.contains('locked')).toBe(false);
      expect(link(fixture, 'nav-themes')?.getAttribute('href')).toBe('/content/themes');
    });
  });

  describe('while no game is in progress', () => {
    it('keeps "Thèmes" enabled, clickable by href, without tooltip', async () => {
      const fixture = render();

      await fixture.whenStable();

      const style = getComputedStyle(link(fixture, 'nav-themes') as HTMLElement);
      expect(style.opacity).not.toBe('0.4');
      expect(style.pointerEvents).not.toBe('none');
      expect(link(fixture, 'nav-themes')?.getAttribute('href')).toBe('/content/themes');
      expect(tooltipOf(fixture, 'nav-themes')).toBeUndefined();
    });
  });

  describe('while disconnected', () => {
    it('keeps "Thèmes" enabled even if a game is in progress', async () => {
      const fixture = render();
      piloting.set(true);
      disconnected.set(true);

      await fixture.whenStable();

      const style = getComputedStyle(link(fixture, 'nav-themes') as HTMLElement);
      expect(style.opacity).not.toBe('0.4');
      expect(style.pointerEvents).not.toBe('none');
      expect(link(fixture, 'nav-themes')?.getAttribute('href')).toBe('/content/themes');
      expect(link(fixture, 'nav-themes')?.hasAttribute('aria-disabled')).toBe(false);
      expect(tooltipOf(fixture, 'nav-themes')).toBeUndefined();
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

@Component({ template: '' })
class BlankPage {}

describe('Sidebar', () => {
  const render = () => {
    TestBed.configureTestingModule({
      providers: [
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
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of, Subject } from 'rxjs';
import { stubIconIn } from '../../shared/ui/icon/icon.test-helpers';
import { ThemeList as ThemeListData, ThemeService } from './theme.service';
import { ThemeList } from './theme-list';

describe('ThemeList', () => {
  const themes = [
    { id: 'theme-1', name: 'Géographie', createdAt: '2026-10-14T12:00:00.000Z', lastUpdatedAt: null },
    { id: 'theme-2', name: 'Histoire', createdAt: '2026-10-15T12:00:00.000Z', lastUpdatedAt: '2026-11-05T12:00:00.000Z' },
    { id: 'theme-3', name: 'Cinéma', createdAt: '2026-09-02T12:00:00.000Z', lastUpdatedAt: null },
  ];

  const render = (answer: Observable<ThemeListData>) => {
    TestBed.configureTestingModule({
      providers: [{ provide: ThemeService, useValue: { list: () => answer } }],
    });
    stubIconIn(ThemeList);
    return TestBed.createComponent(ThemeList);
  };

  const element = (fixture: ComponentFixture<ThemeList>) => fixture.nativeElement as HTMLElement;
  const textOf = (fixture: ComponentFixture<ThemeList>, testId: string) =>
    element(fixture).querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
  const cards = (fixture: ComponentFixture<ThemeList>) =>
    Array.from(element(fixture).querySelectorAll('[data-testid="theme-card"]'));

  it('is titled "Thèmes"', async () => {
    const fixture = render(of({ themes, total: 3 }));

    await fixture.whenStable();

    expect(textOf(fixture, 'themes-title')).toBe('Thèmes');
  });

  it('shows one card per theme', async () => {
    const fixture = render(of({ themes, total: 3 }));

    await fixture.whenStable();

    expect(cards(fixture)).toHaveLength(3);
  });

  it('shows the name of each theme on its card', async () => {
    const fixture = render(of({ themes, total: 3 }));

    await fixture.whenStable();

    const names = cards(fixture)
      .map(card => card.querySelector('[data-testid="theme-name"]')?.textContent?.trim());
    expect(names).toEqual(['Géographie', 'Histoire', 'Cinéma']);
  });

  it('draws the same generic icon on every card', async () => {
    const fixture = render(of({ themes, total: 3 }));

    await fixture.whenStable();

    const icons = fixture.debugElement.queryAll(By.css('[data-testid="theme-card"] app-icon'));
    expect(icons.map(icon => icon.componentInstance.name())).toEqual(['folder-tree', 'folder-tree', 'folder-tree']);
  });

  it('shows when each theme was created, as day/month/year', async () => {
    const fixture = render(of({ themes, total: 3 }));

    await fixture.whenStable();

    const dates = cards(fixture)
      .map(card => card.querySelector('[data-testid="theme-created"]')?.textContent?.trim());
    expect(dates).toEqual(['Créé le 14/10/2026', 'Créé le 15/10/2026', 'Créé le 02/09/2026']);
  });

  it('shows when a theme was last renamed, only if it ever was', async () => {
    const fixture = render(of({ themes, total: 3 }));

    await fixture.whenStable();

    const dates = cards(fixture)
      .map(card => card.querySelector('[data-testid="theme-updated"]')?.textContent?.trim());
    expect(dates).toEqual([undefined, 'Modifié le 05/11/2026', undefined]);
  });

  it('shows the total counted by the hub in the header', async () => {
    const fixture = render(of({ themes, total: 12 }));

    await fixture.whenStable();

    expect(textOf(fixture, 'theme-total')).toBe('12 au total');
  });

  it('shows no total before the hub has answered', async () => {
    const fixture = render(new Subject<ThemeListData>());

    await fixture.whenStable();

    expect(textOf(fixture, 'theme-total')).toBeUndefined();
  });
});

import { Dialog } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { config as rxjsConfig, Observable, of, Subject, throwError } from 'rxjs';
import { ThemeNameDialog } from './theme-name-dialog';
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
    stubIconIn(ThemeNameDialog);
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

  describe('when there is nothing to invite to', () => {
    const invitation = (fixture: ComponentFixture<ThemeList>) =>
      element(fixture).querySelector('[data-testid="empty-state-message"], [data-testid="empty-state-new-theme"]');

    it('does not invite to create a first theme when themes exist', async () => {
      const fixture = render(of({ themes, total: 3 }));

      await fixture.whenStable();

      expect(invitation(fixture)).toBeNull();
    });

    it('does not invite to create a first theme when there is a single theme', async () => {
      const fixture = render(of({ themes: themes.slice(0, 1), total: 1 }));

      await fixture.whenStable();

      expect(invitation(fixture)).toBeNull();
    });

    it('does not claim there is no theme before the hub has answered', async () => {
      const fixture = render(new Subject<ThemeListData>());

      await fixture.whenStable();

      expect(invitation(fixture)).toBeNull();
    });

    it('does not claim there is no theme when the list fails to load', async () => {
      // ThemeList does not handle the error yet (see DEBTS.md): RxJS reports it as unhandled, which this test expects.
      const reported: unknown[] = [];
      const previous = rxjsConfig.onUnhandledError;
      rxjsConfig.onUnhandledError = error => reported.push(error);
      try {
        const fixture = render(throwError(() => new Error('hub unreachable')));

        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve));

        expect(reported).toHaveLength(1);
        expect(invitation(fixture)).toBeNull();
      } finally {
        rxjsConfig.onUnhandledError = previous;
      }
    });
  });

  describe('when the hub has no theme', () => {
    afterEach(() => TestBed.inject(Dialog).closeAll());

    it('offers a "Nouveau thème" button next to the invitation that opens the dialog', async () => {
      const fixture = render(of({ themes: [], total: 0 }));
      await fixture.whenStable();
      const button = element(fixture).querySelector<HTMLButtonElement>('[data-testid="empty-state-new-theme"]');

      button?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(button?.textContent?.trim()).toBe('Nouveau thème');
      expect(document.querySelector('.cdk-dialog-container [data-testid="title"]')?.textContent?.trim()).toBe('Nouveau thème');
    });

    it('invites to create a first theme', async () => {
      const fixture = render(of({ themes: [], total: 0 }));

      await fixture.whenStable();

      expect(textOf(fixture, 'empty-state-message')).toBe('Aucun thème — créez votre premier thème');
    });

    it('draws the themes icon above the invitation', async () => {
      const fixture = render(of({ themes: [], total: 0 }));

      await fixture.whenStable();

      const icons = fixture.debugElement.queryAll(By.css('[data-testid="empty-state"] app-icon'));
      expect(icons.map(icon => icon.componentInstance.name())).toEqual(['folder-tree', 'plus']);
    });

    it('shows no empty grid of cards', async () => {
      const fixture = render(of({ themes: [], total: 0 }));

      await fixture.whenStable();

      expect(element(fixture).querySelector('.cards-grid')).toBeNull();
    });

    it('does not count them in the header, the invitation says it all', async () => {
      const fixture = render(of({ themes: [], total: 0 }));

      await fixture.whenStable();

      expect(textOf(fixture, 'theme-total')).toBeUndefined();
    });
  });

  describe('new theme dialog', () => {
    const openDialog = () => document.querySelector('.cdk-dialog-container');
    const clickNewTheme = async (fixture: ComponentFixture<ThemeList>) => {
      element(fixture).querySelector<HTMLButtonElement>('[data-testid="new-theme"]')?.click();
      fixture.detectChanges();
      await fixture.whenStable();
    };

    afterEach(() => {
      TestBed.inject(Dialog).closeAll();
      vi.restoreAllMocks();
    });

    it('offers a "Nouveau thème" button in the header', async () => {
      const fixture = render(of({ themes, total: 3 }));

      await fixture.whenStable();

      expect(textOf(fixture, 'new-theme')).toBe('Nouveau thème');
    });

    it('opens no dialog until the button is clicked', async () => {
      const fixture = render(of({ themes, total: 3 }));

      await fixture.whenStable();

      expect(openDialog()).toBeNull();
    });

    it('opens a dialog titled "Nouveau thème" when the button is clicked', async () => {
      const fixture = render(of({ themes, total: 3 }));
      await fixture.whenStable();

      await clickNewTheme(fixture);

      expect(openDialog()?.querySelector('[data-testid="title"]')?.textContent?.trim()).toBe('Nouveau thème');
    });

    it('puts the focus on the name field when the dialog opens', async () => {
      // jsdom has no layout: without a geometry, CDK treats every element as hidden and cannot focus any.
      vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
      const fixture = render(of({ themes, total: 3 }));
      await fixture.whenStable();

      await clickNewTheme(fixture);

      expect(document.activeElement).toBe(openDialog()?.querySelector('[data-testid="name-field"]'));
    });

    it('closes the dialog when Escape is pressed', async () => {
      const fixture = render(of({ themes, total: 3 }));
      await fixture.whenStable();
      await clickNewTheme(fixture);

      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
      await fixture.whenStable();

      expect(openDialog()).toBeNull();
    });

    it('closes the dialog from its cancel button', async () => {
      const fixture = render(of({ themes, total: 3 }));
      await fixture.whenStable();
      await clickNewTheme(fixture);

      openDialog()?.querySelector<HTMLButtonElement>('[data-testid="cancel"]')?.click();
      await fixture.whenStable();

      expect(openDialog()).toBeNull();
    });

    it('asks for the name of the theme and nothing else', async () => {
      const fixture = render(of({ themes, total: 3 }));
      await fixture.whenStable();

      await clickNewTheme(fixture);

      const fields = Array.from(openDialog()?.querySelectorAll<HTMLInputElement>('input, textarea, select') ?? []);
      expect(fields.map(field => field.labels?.[0]?.textContent?.trim())).toEqual(['Nom du thème']);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { config as rxjsConfig, Observable, of, Subject, throwError } from 'rxjs';
import { stubIconIn } from '../../shared/ui/icon/icon.test-helpers';
import { ThemeList as ThemeListData, ThemeService } from '../themes/theme.service';
import { Question, QuestionList as QuestionListData, QuestionService } from './question.service';
import { QuestionList } from './question-list';

describe('QuestionList', () => {
  const themes: ThemeListData = {
    themes: [
      { id: 'theme-1', name: 'Géographie', createdAt: '2026-10-14T12:00:00.000Z', lastUpdatedAt: null },
      { id: 'theme-2', name: 'Musique', createdAt: '2026-10-15T12:00:00.000Z', lastUpdatedAt: null },
    ],
    total: 2,
  };

  const mcq: Question = {
    id: 'question-1', themeId: 'theme-1', title: 'Quelle est la capitale de l\'Australie ?', type: 'MCQ',
    level: 3, timeLimit: 30, points: 200, imagePath: '/uploads/questions/question-1-image.jpg', audioPath: null,
  };
  const speed: Question = {
    id: 'question-2', themeId: 'theme-2', title: 'Reconnaissez ce morceau de musique classique', type: 'SPEED',
    level: 4, timeLimit: 15, points: 300, imagePath: null, audioPath: '/uploads/questions/question-2-audio.mp3',
  };
  const plain: Question = {
    id: 'question-3', themeId: 'theme-1', title: 'Quelle mer borde la Croatie ?', type: 'MCQ',
    level: 1, timeLimit: 25, points: 100, imagePath: null, audioPath: null,
  };
  const both: Question = { ...speed, id: 'question-4', imagePath: '/uploads/questions/question-4-image.jpg' };

  const questionsOf = (questions: Question[], total = questions.length): QuestionListData => ({ questions, total });

  const render = (questions: Observable<QuestionListData>, themeList: Observable<ThemeListData> = of(themes)) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: QuestionService, useValue: { list: () => questions } },
        { provide: ThemeService, useValue: { list: () => themeList } },
      ],
    });
    stubIconIn(QuestionList);
    return TestBed.createComponent(QuestionList);
  };

  const element = (fixture: ComponentFixture<QuestionList>) => fixture.nativeElement as HTMLElement;
  const cards = (fixture: ComponentFixture<QuestionList>) =>
    Array.from(element(fixture).querySelectorAll('[data-testid="question-card"]'));
  const textIn = (card: Element, testId: string) =>
    card.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
  const iconsIn = (fixture: ComponentFixture<QuestionList>, card: Element, testId: string) =>
    fixture.debugElement
      .queryAll(By.css(`[data-testid="${testId}"] app-icon`))
      .filter(icon => card.contains(icon.nativeElement))
      .map(icon => icon.componentInstance.name());

  it('is titled "Questions"', async () => {
    const fixture = render(of(questionsOf([mcq])));

    await fixture.whenStable();

    expect(element(fixture).querySelector('[data-testid="questions-title"]')?.textContent?.trim()).toBe('Questions');
  });

  describe('loading', () => {
    it('asks the hub for the questions and the themes at once, without waiting for one to ask the other', async () => {
      const questions = new Subject<QuestionListData>();
      const themeList = new Subject<ThemeListData>();

      const fixture = render(questions, themeList);
      await fixture.whenStable();

      expect(questions.observed).toBe(true);
      expect(themeList.observed).toBe(true);
    });

    it('shows nothing until both the questions and the themes have arrived', async () => {
      const questions = new Subject<QuestionListData>();
      const themeList = new Subject<ThemeListData>();
      const fixture = render(questions, themeList);
      await fixture.whenStable();

      questions.next(questionsOf([mcq], 147));
      questions.complete();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(cards(fixture)).toHaveLength(0);
      expect(element(fixture).querySelector('[data-testid="question-total"]')).toBeNull();
    });

    it('shows the questions as soon as both have arrived', async () => {
      const questions = new Subject<QuestionListData>();
      const themeList = new Subject<ThemeListData>();
      const fixture = render(questions, themeList);
      await fixture.whenStable();

      questions.next(questionsOf([mcq], 147));
      questions.complete();
      themeList.next(themes);
      themeList.complete();
      await fixture.whenStable();

      expect(cards(fixture)).toHaveLength(1);
    });

    it('shows no total before the hub has answered', async () => {
      const fixture = render(new Subject<QuestionListData>(), new Subject<ThemeListData>());

      await fixture.whenStable();

      expect(element(fixture).querySelector('[data-testid="question-total"]')).toBeNull();
    });

    it.each([
      ['the questions fail to load', () => render(throwError(() => new Error('hub unreachable')))],
      ['the themes fail to load', () => render(of(questionsOf([mcq])), throwError(() => new Error('hub unreachable')))],
    ])('shows no question and no total when %s', async (_case, build) => {
      // QuestionList does not handle the error yet (see DEBTS.md): RxJS reports it as unhandled, which this test expects.
      const reported: unknown[] = [];
      const previous = rxjsConfig.onUnhandledError;
      rxjsConfig.onUnhandledError = error => reported.push(error);
      try {
        const fixture = build();

        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve));

        expect(reported).toHaveLength(1);
        expect(cards(fixture)).toHaveLength(0);
        expect(element(fixture).querySelector('[data-testid="question-total"]')).toBeNull();
      } finally {
        rxjsConfig.onUnhandledError = previous;
      }
    });
  });

  describe('total', () => {
    it('shows the total counted by the hub, not the number of questions on the page', async () => {
      const fixture = render(of(questionsOf([mcq, speed], 147)));

      await fixture.whenStable();

      expect(element(fixture).querySelector('[data-testid="question-total"]')?.textContent?.trim()).toBe('147 au total');
      expect(cards(fixture)).toHaveLength(2);
    });

    it('shows "0 au total" and no card when the hub has no question', async () => {
      const fixture = render(of(questionsOf([])));

      await fixture.whenStable();

      expect(element(fixture).querySelector('[data-testid="question-total"]')?.textContent?.trim()).toBe('0 au total');
      expect(cards(fixture)).toHaveLength(0);
    });
  });

  describe('a question card', () => {
    it('shows one card per question, in the order of the hub', async () => {
      const fixture = render(of(questionsOf([mcq, speed, plain])));

      await fixture.whenStable();

      expect(cards(fixture).map(card => textIn(card, 'question-title'))).toEqual([mcq.title, speed.title, plain.title]);
    });

    it('shows the whole title, the card cuts it to two lines by its style', async () => {
      const longTitle = 'Combien de joueurs composent une équipe de rugby à XV sur le terrain lors d\'un match officiel ?';
      const fixture = render(of(questionsOf([{ ...mcq, title: longTitle }])));

      await fixture.whenStable();

      expect(textIn(cards(fixture)[0], 'question-title')).toBe(longTitle);
    });

    it('shows the name of the theme of the question', async () => {
      const fixture = render(of(questionsOf([mcq, speed])));

      await fixture.whenStable();

      expect(cards(fixture).map(card => textIn(card, 'question-theme'))).toEqual(['Géographie', 'Musique']);
    });

    it('shows no theme, and never the raw identifier, when the theme is not among those the hub listed', async () => {
      const fixture = render(of(questionsOf([{ ...mcq, themeId: 'theme-unknown' }])));

      await fixture.whenStable();

      expect(cards(fixture)[0].querySelector('[data-testid="question-theme"]')).toBeNull();
      expect(cards(fixture)[0].textContent).not.toContain('theme-unknown');
    });

    it('shows the MCQ or SPEED badge of the type, with its icon', async () => {
      const fixture = render(of(questionsOf([mcq, speed])));

      await fixture.whenStable();

      const [first, second] = cards(fixture);
      expect(textIn(first, 'question-type')).toBe('MCQ');
      expect(textIn(second, 'question-type')).toBe('SPEED');
      expect(iconsIn(fixture, first, 'question-type')).toEqual(['list']);
      expect(iconsIn(fixture, second, 'question-type')).toEqual(['zap']);
    });

    it.each([1, 2, 3, 4, 5])('shows five dots, filled up to the level, for a level of %i', async level => {
      const fixture = render(of(questionsOf([{ ...mcq, level }])));

      await fixture.whenStable();

      const dots = Array.from(cards(fixture)[0].querySelectorAll('[data-testid="level-dot"]'));
      expect(dots.map(dot => dot.classList.contains('filled'))).toEqual([1, 2, 3, 4, 5].map(rank => rank <= level));
      expect(textIn(cards(fixture)[0], 'question-level')).toBe(`Niveau ${level}`);
    });

    it('shows the duration in seconds', async () => {
      const fixture = render(of(questionsOf([mcq, speed])));

      await fixture.whenStable();

      expect(cards(fixture).map(card => textIn(card, 'question-duration'))).toEqual(['30s', '15s']);
    });

    it('shows the points with a plus sign', async () => {
      const fixture = render(of(questionsOf([mcq, speed])));

      await fixture.whenStable();

      expect(cards(fixture).map(card => textIn(card, 'question-points'))).toEqual(['+200', '+300']);
    });

    it('draws the clock next to the duration', async () => {
      const fixture = render(of(questionsOf([mcq])));

      await fixture.whenStable();

      expect(iconsIn(fixture, cards(fixture)[0], 'question-duration')).toEqual(['clock']);
    });
  });

  describe('media icons', () => {
    const mediaOf = (fixture: ComponentFixture<QuestionList>, card: Element) => ({
      image: iconsIn(fixture, card, 'question-image'),
      audio: iconsIn(fixture, card, 'question-audio'),
    });

    it('shows the image icon for a question with an image only', async () => {
      const fixture = render(of(questionsOf([mcq])));

      await fixture.whenStable();

      expect(mediaOf(fixture, cards(fixture)[0])).toEqual({ image: ['image'], audio: [] });
    });

    it('shows the audio icon for a question with an audio only', async () => {
      const fixture = render(of(questionsOf([speed])));

      await fixture.whenStable();

      expect(mediaOf(fixture, cards(fixture)[0])).toEqual({ image: [], audio: ['music'] });
    });

    it('shows both icons for a question with an image and an audio', async () => {
      const fixture = render(of(questionsOf([both])));

      await fixture.whenStable();

      expect(mediaOf(fixture, cards(fixture)[0])).toEqual({ image: ['image'], audio: ['music'] });
    });

    it('shows no media icon for a question without file', async () => {
      const fixture = render(of(questionsOf([plain])));

      await fixture.whenStable();

      expect(mediaOf(fixture, cards(fixture)[0])).toEqual({ image: [], audio: [] });
    });
  });
});

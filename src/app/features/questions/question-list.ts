import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Icon } from '../../shared/ui/icon/icon';
import { ThemeService } from '../themes/theme.service';
import { Question, QuestionList as QuestionListData, QuestionService } from './question.service';

const LEVEL_RANKS = [1, 2, 3, 4, 5];

interface QuestionCard extends Question {
    themeName: string | undefined;
    levelDots: boolean[];
}

@Component({
    selector: 'app-question-list',
    templateUrl: './question-list.html',
    styleUrl: './question-list.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon]
})
export class QuestionList {
    private readonly list = signal<{ page: QuestionListData; themeNames: Map<string, string> } | null>(null);

    // Le total est celui du hub : la page n'affiche que les 20 premières questions (pas de pagination encore).
    protected readonly total = computed(() => this.list()?.page.total);
    protected readonly cards = computed<QuestionCard[]>(() => {
        const list = this.list();
        return (list?.page.questions ?? []).map(question => ({
            ...question,
            themeName: list?.themeNames.get(question.themeId),
            levelDots: LEVEL_RANKS.map(rank => rank <= question.level)
        }));
    });

    constructor() {
        forkJoin({ page: inject(QuestionService).list(), themes: inject(ThemeService).list() })
            .pipe(takeUntilDestroyed())
            .subscribe(({ page, themes }) => this.list.set({
                page,
                themeNames: new Map(themes.themes.map(theme => [theme.id, theme.name]))
            }));
    }
}

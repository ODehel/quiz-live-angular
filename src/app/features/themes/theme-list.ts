import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Icon } from '../../shared/ui/icon/icon';
import { ThemeList as ThemeListData, ThemeService } from './theme.service';

@Component({
    selector: 'app-theme-list',
    templateUrl: './theme-list.html',
    styleUrl: './theme-list.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [DatePipe, Icon]
})
export class ThemeList {
    protected readonly page = signal<ThemeListData | null>(null);

    constructor() {
        inject(ThemeService).list()
            .pipe(takeUntilDestroyed())
            .subscribe(page => this.page.set(page));
    }
}

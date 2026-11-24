import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { GameStateService } from "../../core/game-state/game-state.service";

const SUBTITLE_NAMES = 3;

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
    private readonly gameState = inject(GameStateService);
    // Tant que la liste est inconnue, `connectedBuzzers()` vaut `[]` comme pour « vide » : on ne l'affiche pas.
    protected readonly buzzers = computed(() =>
        this.gameState.buzzersKnown() ? this.gameState.connectedBuzzers() : null);
    protected readonly buzzersCount = computed(() => this.buzzers()?.length ?? null);
    protected readonly buzzersSubtitle = computed(() => {
        const names = this.buzzers() ?? [];
        const others = names.length - SUBTITLE_NAMES;
        const listed = names.slice(0, SUBTITLE_NAMES).join(', ');
        return others > 0 ? `${listed} +${others}` : listed;
    });
}

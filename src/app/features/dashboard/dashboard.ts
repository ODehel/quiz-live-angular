import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GameStateService } from "../../core/game-state/game-state.service";
import { WebSocketService } from "../../core/websocket/websocket.service";
import { QuestionService } from "../questions/question.service";

const SUBTITLE_NAMES = 3;

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
    private readonly gameState = inject(GameStateService);
    private readonly webSocket = inject(WebSocketService);
    // Métrique REST « Questions » (CA-2 à CA-5) : indépendante de la socket, elle ne lit ni `isDisconnected()` ni `buzzersKnown()`.
    // `null` = pas de total (échec de l'appel) : le gabarit affiche `—`. « Quiz » et « Parties jouées » n'ont pas d'appel (décision #67).
    protected readonly questionsLoading = signal(true);
    protected readonly questionsTotal = signal<number | null>(null);
    // Tant que la liste est inconnue, `connectedBuzzers()` vaut `[]` comme pour « vide » : on ne l'affiche pas.
    // En « Déconnecté », la dernière liste est périmée : le dashboard l'ignore, le service la garde (CA-27).
    protected readonly buzzers = computed(() =>
        this.gameState.buzzersKnown() && !this.webSocket.isDisconnected() ? this.gameState.connectedBuzzers() : null);
    protected readonly buzzersCount = computed(() => this.buzzers()?.length ?? null);
    protected readonly buzzersSubtitle = computed(() => {
        const names = this.buzzers() ?? [];
        const others = names.length - SUBTITLE_NAMES;
        const listed = names.slice(0, SUBTITLE_NAMES).join(', ');
        return others > 0 ? `${listed} +${others}` : listed;
    });

    constructor() {
        inject(QuestionService).count()
            .pipe(takeUntilDestroyed())
            .subscribe({
                next: total => {
                    this.questionsTotal.set(total);
                    this.questionsLoading.set(false);
                },
                error: () => this.questionsLoading.set(false)
            });
    }
}

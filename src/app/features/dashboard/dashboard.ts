import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GameStateService, GameStatus } from "../../core/game-state/game-state.service";
import { WebSocketService } from "../../core/websocket/websocket.service";
import { QuestionService } from "../questions/question.service";

const SUBTITLE_NAMES = 3;

// Libellé français du statut dans la bannière (CA-6, décision #95). Copie locale du tableau de mapping de
// `StatusBadgeComponent` (US-ANG-002), qui n'existe pas encore : dette dans `DEBTS.md` (tâche 0.15 du plan).
// Seuls les statuts de pilotage ont un libellé : `COMPLETED`, `IN_ERROR` et `null` n'affichent pas la bannière.
function bannerStatusLabel(status: GameStatus | null): string {
    switch (status) {
        case 'PENDING':
            return 'En attente';
        case 'OPEN':
        case 'QUESTION_TITLE':
        case 'QUESTION_OPEN':
        case 'QUESTION_BUZZED':
        case 'QUESTION_CLOSED':
            return 'En cours';
        default:
            return '';
    }
}

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

    // Bannière de partie active (CA-6, CA-7, CA-9) : elle suit `isPiloting()`, un `computed` du service, sans écouter la socket.
    // Absente en « Déconnecté » (CA-28) et tant que la liste des buzzers est inconnue (CA-31) : `buzzers()` est `null` dans ces deux cas.
    protected readonly showBanner = computed(() => this.gameState.isPiloting() && this.buzzers() !== null);
    protected readonly bannerStatus = computed(() => bannerStatusLabel(this.gameState.status()));

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
